#!/usr/bin/env python3
# filepath: /Users/polly/Downloads/Sublime_Workspace/GitHub_Workspace/Hr_Copilot_v2/scripts/test_llm_logging.py
"""
测试LLM日志记录功能
"""

import asyncio
import sys
import os

# 添加app目录到Python路径
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.logging_config import setup_logging
from app.services.llm_service import llm_service

async def test_llm_logging():
    """测试LLM日志记录功能"""
    
    # 初始化日志系统
    app_logger = setup_logging()
    app_logger.info("开始测试LLM日志记录功能")
    
    # 测试简历信息提取
    print("测试简历信息提取...")
    test_resume_text = """
    姓名: 张三
    邮箱: zhangsan@example.com
    电话: 13800138000
    教育背景: 北京大学计算机科学与技术本科
    工作经验: 3年软件开发经验
    当前职位: 高级软件工程师
    当前公司: ABC科技有限公司
    技能: Python, JavaScript, React, Django, MySQL
    """
    
    extracted_info = await llm_service.extract_resume_info(test_resume_text)
    print(f"提取结果: {extracted_info}")
    
    # 测试筛选条件优化
    print("\n测试筛选条件优化...")
    natural_query = "找一个有3年以上Python开发经验的全栈工程师"
    
    optimized_criteria = await llm_service.optimize_filter_criteria(natural_query)
    print(f"优化结果: {optimized_criteria}")
    
    # 测试智能候选人匹配
    print("\n测试智能候选人匹配...")
    job_requirements = "招聘一名有3年以上经验的Python后端开发工程师，熟悉Django和数据库设计"
    candidates_data = [
        {
            "id": 1,
            "name": "张三",
            "email": "zhangsan@example.com",
            "skills": ["Python", "Django", "MySQL"],
            "experience_years": 3,
            "current_position": "高级软件工程师"
        },
        {
            "id": 2,
            "name": "李四",
            "email": "lisi@example.com", 
            "skills": ["Java", "Spring", "Oracle"],
            "experience_years": 2,
            "current_position": "软件工程师"
        }
    ]
    
    matches = await llm_service.smart_candidate_matching(job_requirements, candidates_data)
    print(f"匹配结果: {matches}")
    
    app_logger.info("LLM日志记录功能测试完成")
    print("\n测试完成！请查看 logs/llm_requests_*.log 文件来验证日志记录。")

if __name__ == "__main__":
    asyncio.run(test_llm_logging())
