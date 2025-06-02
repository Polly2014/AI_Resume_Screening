#!/usr/bin/env python3
"""
创建测试用的PDF简历文件
"""
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import os

def create_test_resume_pdf():
    """创建一个测试用的PDF简历"""
    filename = "test_resume.pdf"
    c = canvas.Canvas(filename, pagesize=letter)
    width, height = letter
    
    # 设置字体和大小
    c.setFont("Helvetica-Bold", 16)
    c.drawString(100, height - 100, "张三")
    
    c.setFont("Helvetica", 12)
    c.drawString(100, height - 130, "电话: 13800138000")
    c.drawString(100, height - 150, "邮箱: zhangsan@example.com")
    c.drawString(100, height - 170, "地址: 北京市朝阳区")
    
    # 工作经验
    c.setFont("Helvetica-Bold", 14)
    c.drawString(100, height - 210, "工作经验")
    
    c.setFont("Helvetica", 12)
    c.drawString(100, height - 240, "• 高级软件工程师 - 阿里巴巴 (2020-2023)")
    c.drawString(120, height - 260, "负责大型分布式系统开发，熟练使用Java、Python")
    c.drawString(120, height - 280, "参与双11核心系统架构设计和优化")
    
    c.drawString(100, height - 310, "• 软件工程师 - 腾讯 (2018-2020)")
    c.drawString(120, height - 330, "负责微信支付相关功能开发")
    c.drawString(120, height - 350, "熟练使用Spring Boot、MySQL、Redis")
    
    # 技能
    c.setFont("Helvetica-Bold", 14)
    c.drawString(100, height - 390, "技能")
    
    c.setFont("Helvetica", 12)
    c.drawString(100, height - 420, "• 编程语言: Java, Python, JavaScript, TypeScript")
    c.drawString(100, height - 440, "• 框架: Spring Boot, FastAPI, React, Vue.js")
    c.drawString(100, height - 460, "• 数据库: MySQL, PostgreSQL, Redis, MongoDB")
    c.drawString(100, height - 480, "• 工具: Docker, Kubernetes, Git, Jenkins")
    
    # 教育背景
    c.setFont("Helvetica-Bold", 14)
    c.drawString(100, height - 520, "教育背景")
    
    c.setFont("Helvetica", 12)
    c.drawString(100, height - 550, "• 清华大学 - 计算机科学与技术 (2014-2018)")
    c.drawString(120, height - 570, "学士学位，GPA: 3.8/4.0")
    
    c.save()
    print(f"PDF简历已创建: {filename}")
    return filename

if __name__ == "__main__":
    create_test_resume_pdf()
