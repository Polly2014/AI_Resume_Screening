import json
import logging
import time
from typing import Dict, Any, Optional, List
from datetime import datetime
import litellm
from app.core.config import settings

# 配置LLM专用的日志记录器
logger = logging.getLogger(__name__)
llm_logger = logging.getLogger("llm_requests")

# 设置日志格式和处理器
if not llm_logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    handler.setFormatter(formatter)
    llm_logger.addHandler(handler)
    llm_logger.setLevel(logging.INFO)

class LLMService:
    """LLM服务，用于智能信息提取和筛选"""
    
    def __init__(self):
        if settings.OPENROUTER_API_KEY:
            # 设置OpenRouter配置
            litellm.api_key = settings.OPENROUTER_API_KEY
            # 不需要设置api_base，litellm会自动处理OpenRouter
            # 或者明确设置为OpenRouter的base URL
            # litellm.api_base = "https://openrouter.ai/api/v1"
    
    def _log_llm_request(self, method: str, prompt: str, model: str) -> str:
        """记录LLM请求日志"""
        request_id = f"req_{int(time.time() * 1000)}"
        log_data = {
            "request_id": request_id,
            "timestamp": datetime.now().isoformat(),
            "method": method,
            "model": model,
            "prompt_length": len(prompt),
            "prompt_preview": prompt[:200] + "..." if len(prompt) > 200 else prompt
        }
        llm_logger.info(f"LLM请求开始: {json.dumps(log_data, ensure_ascii=False)}")
        return request_id
    
    def _log_llm_response(self, request_id: str, response: str, success: bool, error: str = None, duration: float = None):
        """记录LLM响应日志"""
        log_data = {
            "request_id": request_id,
            "timestamp": datetime.now().isoformat(),
            "success": success,
            "response_length": len(response) if response else 0,
            "response_preview": response[:200] + "..." if response and len(response) > 200 else response,
            "duration_seconds": duration,
            "error": error
        }
        
        if success:
            llm_logger.info(f"LLM请求成功: {json.dumps(log_data, ensure_ascii=False)}")
        else:
            llm_logger.error(f"LLM请求失败: {json.dumps(log_data, ensure_ascii=False)}")
    
    def _log_fallback_usage(self, method: str, reason: str):
        """记录使用回退方法的日志"""
        log_data = {
            "timestamp": datetime.now().isoformat(),
            "method": method,
            "reason": reason,
            "fallback": True
        }
        logger.info(f"使用回退方法: {json.dumps(log_data, ensure_ascii=False)}")
    
    async def extract_resume_info(self, resume_text: str) -> Dict[str, Any]:
        """使用LLM提取简历信息"""
        
        # 临时使用简单的文本解析来替代LLM，避免API连接问题
        if not settings.OPENROUTER_API_KEY or settings.OPENROUTER_API_KEY == "your_openrouter_api_key_here":
            self._log_fallback_usage("extract_resume_info", "API密钥未配置或为默认值")
            return self._fallback_extract(resume_text)
        
        prompt = f"""
请从以下简历文本中提取结构化信息，并以JSON格式返回。请提取以下字段：

1. name: 姓名
2. email: 邮箱地址
3. phone: 电话号码
4. education: 教育背景（字符串格式，如："博士 - 北京大学 - 口腔修复学"）
5. experience_years: 工作年限（数字）
6. current_position: 当前职位
7. current_company: 当前公司
8. skills: 技能列表（数组）
9. work_experience: 工作经历摘要

注意：请确保education字段返回字符串格式，不要返回嵌套对象。

简历文本：
{resume_text}

请严格按照JSON格式返回，不要包含其他文字说明：
"""
        
        # 记录请求开始
        request_id = self._log_llm_request("extract_resume_info", prompt, settings.LLM_MODEL)
        start_time = time.time()
        
        try:
            response = await litellm.acompletion(
                model=settings.LLM_MODEL,
                messages=[
                    {
                        "role": "system", 
                        "content": "你是一个专业的简历分析助手，能够准确提取简历中的关键信息。"
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=1000
            )
            
            duration = time.time() - start_time
            content = response.choices[0].message.content.strip()
            
            # 记录响应成功
            self._log_llm_response(request_id, content, True, duration=duration)
            
            # 尝试解析JSON
            try:
                # 移除可能的markdown代码块标记
                if content.startswith("```json"):
                    content = content[7:]
                if content.endswith("```"):
                    content = content[:-3]
                    
                extracted_data = json.loads(content)
                logger.info(f"简历信息提取成功，提取到{len(extracted_data)}个字段")
                return extracted_data
            except json.JSONDecodeError as json_error:
                # JSON解析失败，记录错误但不算作LLM请求失败
                logger.warning(f"LLM响应JSON解析失败: {str(json_error)}, 原始响应: {content}")
                return {}
                
        except Exception as e:
            duration = time.time() - start_time
            error_msg = str(e)
            
            # 记录响应失败
            self._log_llm_response(request_id, "", False, error=error_msg, duration=duration)
            
            logger.error(f"LLM简历信息提取失败: {error_msg}")
            return {}
    
    async def optimize_filter_criteria(self, natural_query: str) -> Dict[str, Any]:
        """使用LLM优化筛选条件"""
        
        prompt = f"""
用户的自然语言筛选需求："{natural_query}"

请将这个需求转换为结构化的筛选条件，以JSON格式返回：

{{
    "keywords": ["关键词1", "关键词2"],
    "education": "教育要求",
    "min_experience": 最小工作年限(数字),
    "max_experience": 最大工作年限(数字),
    "skills": ["技能1", "技能2"],
    "position_keywords": ["职位关键词1", "职位关键词2"],
    "company_keywords": ["公司关键词1", "公司关键词2"]
}}

如果某个条件不适用，请设置为null或空数组。
"""
        
        # 记录请求开始
        request_id = self._log_llm_request("optimize_filter_criteria", prompt, settings.LLM_MODEL)
        start_time = time.time()
        
        try:
            response = await litellm.acompletion(
                model=settings.LLM_MODEL,
                messages=[
                    {
                        "role": "system", 
                        "content": "你是一个专业的HR助手，能够理解招聘需求并转换为筛选条件。"
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=500
            )
            
            duration = time.time() - start_time
            content = response.choices[0].message.content.strip()
            
            # 记录响应成功
            self._log_llm_response(request_id, content, True, duration=duration)
            
            try:
                if content.startswith("```json"):
                    content = content[7:]
                if content.endswith("```"):
                    content = content[:-3]
                    
                criteria = json.loads(content)
                logger.info(f"筛选条件优化成功，生成{len(criteria)}个筛选维度")
                return criteria
            except json.JSONDecodeError as json_error:
                logger.warning(f"筛选条件LLM响应JSON解析失败: {str(json_error)}, 原始响应: {content}")
                return {}
                
        except Exception as e:
            duration = time.time() - start_time
            error_msg = str(e)
            
            # 记录响应失败
            self._log_llm_response(request_id, "", False, error=error_msg, duration=duration)
            
            logger.error(f"LLM筛选条件优化失败: {error_msg}")
            return {}
    
    async def smart_candidate_matching(
        self, 
        job_requirements: str, 
        candidates_data: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """智能候选人匹配和评分"""
        
        prompt = f"""
职位要求：{job_requirements}

候选人数据：
{json.dumps(candidates_data, ensure_ascii=False, indent=2)}

请为每个候选人评分（0-100分），并给出匹配理由。返回JSON格式：

{{
    "matches": [
        {{
            "candidate_id": 候选人ID,
            "score": 评分(0-100),
            "reasons": ["匹配理由1", "匹配理由2"],
            "concerns": ["潜在问题1", "潜在问题2"]
        }}
    ]
}}
"""
        
        # 记录请求开始
        request_id = self._log_llm_request("smart_candidate_matching", prompt, settings.LLM_MODEL)
        start_time = time.time()
        
        try:
            response = await litellm.acompletion(
                model=settings.LLM_MODEL,
                messages=[
                    {
                        "role": "system", 
                        "content": "你是一个专业的HR分析师，能够准确评估候选人与职位的匹配度。"
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=2000
            )
            
            duration = time.time() - start_time
            content = response.choices[0].message.content.strip()
            
            # 记录响应成功
            self._log_llm_response(request_id, content, True, duration=duration)
            
            try:
                # 处理多种格式的响应
                if "```json" in content:
                    # 提取JSON代码块
                    start_idx = content.find("```json") + 7
                    end_idx = content.find("```", start_idx)
                    if end_idx != -1:
                        content = content[start_idx:end_idx]
                elif "```" in content:
                    # 处理没有json标识的代码块
                    start_idx = content.find("```") + 3
                    end_idx = content.find("```", start_idx)
                    if end_idx != -1:
                        content = content[start_idx:end_idx]
                elif "{" in content and "}" in content:
                    # 提取JSON部分（从第一个{到最后一个}）
                    start_idx = content.find("{")
                    end_idx = content.rfind("}") + 1
                    content = content[start_idx:end_idx]
                
                content = content.strip()
                matches = json.loads(content)
                match_results = matches.get("matches", [])
                logger.info(f"智能匹配成功，为{len(match_results)}个候选人生成匹配结果")
                return match_results
            except json.JSONDecodeError as json_error:
                logger.warning(f"候选人匹配LLM响应JSON解析失败: {str(json_error)}, 原始响应: {content}")
                return []
                
        except Exception as e:
            duration = time.time() - start_time
            error_msg = str(e)
            
            # 记录响应失败
            self._log_llm_response(request_id, "", False, error=error_msg, duration=duration)
            
            logger.error(f"智能候选人匹配失败: {error_msg}")
            return []
    
    def _fallback_extract(self, resume_text: str) -> Dict[str, Any]:
        """简单的文本解析回退方法"""
        import re
        
        logger.info("使用回退方法进行简历信息提取")
        
        extracted = {
            "name": None,
            "email": None,
            "phone": None,
            "education": None,
            "experience_years": None,
            "current_position": None,
            "current_company": None,
            "skills": [],
            "work_experience": None
        }
        
        # 提取邮箱
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        email_match = re.search(email_pattern, resume_text)
        if email_match:
            extracted["email"] = email_match.group()
        
        # 提取电话号码
        phone_pattern = r'1[3-9]\d{9}'
        phone_match = re.search(phone_pattern, resume_text)
        if phone_match:
            extracted["phone"] = phone_match.group()
        
        # 简单的姓名提取
        lines = resume_text.split('\n')
        for line in lines:
            line = line.strip()
            if '姓名' in line and ':' in line:
                extracted["name"] = line.split(':')[1].strip()
                break
            elif line and len(line) <= 5 and not any(char in line for char in ['@', ':', '/', '.']):
                # 可能是姓名（短行且不包含特殊字符）
                if not extracted["name"]:
                    extracted["name"] = line
        
        # 提取技能
        skills_keywords = ['JavaScript', 'Python', 'Java', 'React', 'Vue', 'Node.js', 'Django', 'FastAPI', 'MySQL', 'PostgreSQL', 'Docker', 'Git', 'HTML', 'CSS', 'TypeScript']
        found_skills = []
        for skill in skills_keywords:
            if skill in resume_text:
                found_skills.append(skill)
        extracted["skills"] = found_skills
        
        # 设置默认值
        if not extracted["name"]:
            cleaned_text = resume_text[:10].replace(' ', '').replace('\n', '')
            extracted["name"] = f"候选人_{cleaned_text}"
        
        logger.info(f"回退方法提取完成，提取到{len([v for v in extracted.values() if v])}个非空字段")
        
        return extracted

# 创建LLM服务实例
llm_service = LLMService()
