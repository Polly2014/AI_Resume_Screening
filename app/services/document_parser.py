import os
import re
from typing import Dict, Any, Optional
from docx import Document
import PyPDF2

class DocumentParser:
    """文档解析服务"""
    
    def extract_text_from_pdf(self, file_path: str) -> str:
        """从PDF提取文本"""
        try:
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                text = ""
                for page in reader.pages:
                    text += page.extract_text() + "\n"
                return text.strip()
        except Exception as e:
            raise ValueError(f"PDF解析失败: {str(e)}")
    
    def extract_text_from_docx(self, file_path: str) -> str:
        """从DOCX提取文本"""
        try:
            doc = Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text.strip()
        except Exception as e:
            raise ValueError(f"DOCX解析失败: {str(e)}")
    
    def extract_text_from_doc(self, file_path: str) -> str:
        """从DOC提取文本（简单实现，可能需要额外库）"""
        # 注意：这里需要额外的库来处理.doc文件
        # 可以使用python-docx2txt或其他库
        raise NotImplementedError("DOC格式暂不支持，请转换为DOCX格式")
    
    def extract_text(self, file_path: str, file_type: str) -> str:
        """根据文件类型提取文本"""
        if file_type.lower() == "pdf":
            return self.extract_text_from_pdf(file_path)
        elif file_type.lower() == "docx":
            return self.extract_text_from_docx(file_path)
        elif file_type.lower() == "doc":
            return self.extract_text_from_doc(file_path)
        else:
            raise ValueError(f"不支持的文件类型: {file_type}")
    
    def extract_basic_info(self, text: str) -> Dict[str, Any]:
        """使用规则提取基础信息"""
        info = {}
        
        # 提取邮箱
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        if emails:
            info['email'] = emails[0]
        
        # 提取电话号码
        phone_pattern = r'(\+?86)?[-\s]?1[3-9]\d{9}|\d{3,4}-\d{7,8}'
        phones = re.findall(phone_pattern, text)
        if phones:
            info['phone'] = ''.join(phones[0]) if isinstance(phones[0], tuple) else phones[0]
        
        # 提取常见技能关键词
        skill_keywords = [
            'Python', 'Java', 'JavaScript', 'React', 'Vue', 'Angular',
            'Node.js', 'Django', 'Flask', 'Spring', 'MySQL', 'PostgreSQL',
            'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure',
            'Git', 'Linux', 'HTML', 'CSS', 'SQL'
        ]
        
        found_skills = []
        text_upper = text.upper()
        for skill in skill_keywords:
            if skill.upper() in text_upper:
                found_skills.append(skill)
        
        if found_skills:
            info['skills'] = found_skills
        
        # 提取工作年限（简单模式匹配）
        experience_pattern = r'(\d+)\s*年.*?经验|(\d+)\s*years?\s*experience'
        experience_match = re.search(experience_pattern, text, re.IGNORECASE)
        if experience_match:
            years = experience_match.group(1) or experience_match.group(2)
            info['experience_years'] = int(years)
        
        return info

# 创建解析器实例
document_parser = DocumentParser()
