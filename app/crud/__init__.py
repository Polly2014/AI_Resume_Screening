# 导入所有CRUD操作
from .candidate import candidate_crud
from .resume import resume_crud

__all__ = ["candidate_crud", "resume_crud"]
