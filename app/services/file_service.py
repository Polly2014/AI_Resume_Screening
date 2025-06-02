import os
import uuid
from typing import List, Tuple, Optional
from fastapi import UploadFile
from app.core.config import settings

class FileService:
    """文件处理服务"""
    
    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIR
        os.makedirs(self.upload_dir, exist_ok=True)
    
    def validate_file(self, file: UploadFile) -> Tuple[bool, str]:
        """验证上传文件"""
        # 检查文件扩展名
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in settings.ALLOWED_EXTENSIONS:
            return False, f"不支持的文件格式: {file_ext}"
        
        # 检查文件大小（这里需要读取内容，所以在实际保存时再检查）
        return True, "文件验证通过"
    
    async def save_file(self, file: UploadFile) -> Tuple[str, int]:
        """保存上传的文件"""
        try:
            # 生成唯一文件名
            file_ext = os.path.splitext(file.filename)[1]
            unique_filename = f"{uuid.uuid4()}{file_ext}"
            file_path = os.path.join(self.upload_dir, unique_filename)
            
            # 保存文件并计算大小
            content = await file.read()
            file_size = len(content)
            
            # 检查文件大小
            if file_size > settings.MAX_FILE_SIZE:
                raise ValueError(f"文件大小超出限制: {file_size} > {settings.MAX_FILE_SIZE}")
            
            # 确保上传目录存在
            os.makedirs(self.upload_dir, exist_ok=True)
            
            with open(file_path, "wb") as f:
                f.write(content)
            
            return file_path, file_size
        except Exception as e:
            # 记录详细错误信息并重新抛出
            import logging
            logger = logging.getLogger("app.services.file")
            logger.error(f"保存文件失败: {file.filename}, 错误: {str(e)}", exc_info=True)
            raise
    
    def delete_file(self, file_path: str) -> bool:
        """删除文件"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        except Exception:
            return False

# 创建服务实例
file_service = FileService()
