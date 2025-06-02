import os
import logging
from typing import List
from urllib.parse import quote
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.database import get_db
from app.crud.candidate import candidate_crud
from app.crud.resume import resume_crud
from app.schemas.candidate import UploadResponse, CandidateCreate
from app.services.file_service import file_service
from app.services.document_parser import document_parser
from app.services.llm_service import llm_service

router = APIRouter()
logger = logging.getLogger("app.api.resumes")

async def process_resume_background(
    file_path: str,
    filename: str,
    resume_id: int,
    db: Session
):
    """后台处理简历的任务"""
    logger.info(f"开始后台处理简历: {filename}, resume_id: {resume_id}")
    
    try:
        # 更新状态为处理中
        logger.debug(f"更新简历状态为处理中: resume_id={resume_id}")
        resume_crud.update_processing_status(
            db, resume_id=resume_id, status="processing"
        )
        
        # 提取文件类型
        file_ext = os.path.splitext(filename)[1][1:].lower()
        logger.debug(f"检测到文件类型: {file_ext}")
        
        # 提取文本
        logger.info(f"开始提取文本内容: {filename}")
        raw_text = document_parser.extract_text(file_path, file_ext)
        logger.info(f"文本提取完成，内容长度: {len(raw_text)} 字符")
        
        # 使用规则提取基础信息
        logger.debug("开始规则基础信息提取")
        basic_info = document_parser.extract_basic_info(raw_text)
        logger.info(f"规则提取完成，提取到 {len(basic_info)} 个基础字段")
        
        # 使用LLM提取详细信息
        logger.info("开始LLM智能信息提取")
        llm_info = await llm_service.extract_resume_info(raw_text)
        logger.info(f"LLM提取完成，提取到 {len(llm_info)} 个字段")
        
        # 合并提取的信息
        extracted_data = {**basic_info, **llm_info}
        logger.info(f"信息合并完成，总共 {len(extracted_data)} 个字段")
        
        # 更新简历记录
        logger.debug(f"更新简历处理结果: resume_id={resume_id}")
        resume_crud.update_processing_status(
            db,
            resume_id=resume_id,
            status="completed",
            raw_text=raw_text,
            extracted_data=extracted_data
        )
        
        # 获取简历记录以获取candidate_id
        resume = resume_crud.get(db, resume_id)
        if resume and resume.candidate_id:
            logger.debug(f"开始更新候选人信息: candidate_id={resume.candidate_id}")
            # 更新候选人信息
            candidate = candidate_crud.get(db, resume.candidate_id)
            if candidate and extracted_data:
                # 添加调试日志
                logger.debug(f"提取的数据内容: {extracted_data}")
                
                # 创建更新数据，只更新非空字段
                update_data = {}
                
                if 'name' in extracted_data and extracted_data['name']:
                    update_data['name'] = extracted_data['name']
                if 'email' in extracted_data and extracted_data['email']:
                    update_data['email'] = extracted_data['email']
                if 'phone' in extracted_data and extracted_data['phone']:
                    update_data['phone'] = extracted_data['phone']
                if 'education' in extracted_data and extracted_data['education']:
                    education_value = extracted_data['education']
                    logger.debug(f"处理教育信息: {education_value}, 类型: {type(education_value)}")
                    # 如果education是字典，转换为字符串
                    if isinstance(education_value, dict):
                        logger.debug("检测到教育信息为字典格式，开始转换")
                        # 构建教育背景字符串
                        education_parts = []
                        if education_value.get('degree'):
                            education_parts.append(education_value['degree'])
                        if education_value.get('school'):
                            education_parts.append(education_value['school'])
                        if education_value.get('major'):
                            education_parts.append(education_value['major'])
                        update_data['education'] = ' - '.join(education_parts) if education_parts else str(education_value)
                        logger.debug(f"转换教育背景字典为字符串: {update_data['education']}")
                    else:
                        update_data['education'] = str(education_value)
                        logger.debug(f"教育信息已是字符串格式: {update_data['education']}")
                if 'experience_years' in extracted_data and extracted_data['experience_years']:
                    update_data['experience_years'] = extracted_data['experience_years']
                if 'current_position' in extracted_data and extracted_data['current_position']:
                    update_data['current_position'] = extracted_data['current_position']
                if 'current_company' in extracted_data and extracted_data['current_company']:
                    update_data['current_company'] = extracted_data['current_company']
                if 'skills' in extracted_data and extracted_data['skills']:
                    update_data['skills'] = extracted_data['skills']
                
                logger.debug(f"准备更新候选人字段: {list(update_data.keys())}")
                
                if update_data:
                    # 检查邮箱冲突
                    if 'email' in update_data:
                        email_to_check = update_data['email']
                        existing_candidate = candidate_crud.get_by_email(db, email=email_to_check)
                        if existing_candidate and existing_candidate.id != candidate.id:
                            # 如果邮箱已存在且不是当前候选人，跳过邮箱更新
                            del update_data['email']
                            logger.warning(f"邮箱 {email_to_check} 已存在，跳过邮箱更新")
                    
                    if update_data:  # 如果还有其他数据需要更新
                        logger.debug(f"最终更新数据: {update_data}")
                        from app.schemas.candidate import CandidateUpdate
                        candidate_update = CandidateUpdate(**update_data)
                        candidate_crud.update(db, db_obj=candidate, obj_in=candidate_update)
                        logger.info(f"候选人信息更新成功: candidate_id={candidate.id}, 更新字段={list(update_data.keys())}")
                    else:
                        logger.info("没有可更新的候选人字段")
                else:
                    logger.info("提取的数据中没有可更新的字段")
            else:
                logger.warning(f"未找到候选人或提取数据为空: candidate_id={resume.candidate_id}")
        else:
            logger.warning(f"未找到简历记录或candidate_id为空: resume_id={resume_id}")
        
        logger.info(f"简历处理完成: {filename}, resume_id={resume_id}")
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"简历处理失败: {filename}, resume_id={resume_id}, 错误: {error_msg}")
        
        # 更新状态为失败
        try:
            resume_crud.update_processing_status(
                db,
                resume_id=resume_id,
                status="failed",
                error_message=error_msg
            )
            logger.debug(f"已更新简历状态为失败: resume_id={resume_id}")
        except Exception as update_error:
            logger.error(f"更新简历失败状态时出错: {str(update_error)}")

@router.post("/upload", response_model=UploadResponse)
async def upload_resumes(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """批量上传简历"""
    logger.info(f"开始批量上传简历，共 {len(files)} 个文件")
    
    uploaded_files = []
    failed_files = []
    
    if not files:
        logger.warning("请求中没有文件")
        return UploadResponse(
            message="未接收到任何文件",
            uploaded_files=[],
            failed_files=[],
            total_processed=0
        )
    
    for i, file in enumerate(files):
        logger.debug(f"处理第 {i+1}/{len(files)} 个文件: {file.filename}")
        
        try:
            # 验证文件
            logger.debug(f"验证文件: {file.filename}")
            is_valid, message = file_service.validate_file(file)
            if not is_valid:
                logger.warning(f"文件验证失败: {file.filename}, 原因: {message}")
                failed_files.append({
                    "filename": file.filename,
                    "error": message
                })
                continue
            
            # 保存文件
            logger.debug(f"保存文件: {file.filename}")
            try:
                file_path, file_size = await file_service.save_file(file)
            except ValueError as e:
                logger.warning(f"文件保存失败: {file.filename}, 原因: {str(e)}")
                failed_files.append({
                    "filename": file.filename,
                    "error": str(e)
                })
                continue
            except Exception as e:
                logger.error(f"文件保存异常: {file.filename}, 原因: {str(e)}")
                failed_files.append({
                    "filename": file.filename,
                    "error": "文件保存失败"
                })
                continue
                
            file_ext = os.path.splitext(file.filename)[1][1:].lower()
            logger.info(f"文件保存成功: {file.filename}, 大小: {file_size} bytes, 路径: {file_path}")
            
            # 创建候选人记录（如果不存在）
            logger.debug(f"创建候选人记录: {file.filename}")
            candidate_data = CandidateCreate(
                name=f"候选人_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                email=None
            )
            candidate = candidate_crud.create(db, obj_in=candidate_data)
            logger.debug(f"候选人创建成功: candidate_id={candidate.id}")
            
            # 创建简历记录
            logger.debug(f"创建简历记录: {file.filename}")
            resume = resume_crud.create(
                db,
                filename=file.filename,
                file_path=file_path,
                file_size=file_size,
                file_type=file_ext,
                candidate_id=candidate.id
            )
            logger.info(f"简历记录创建成功: resume_id={resume.id}, candidate_id={candidate.id}")
            
            # 添加后台处理任务
            logger.debug(f"添加后台处理任务: {file.filename}, resume_id={resume.id}")
            background_tasks.add_task(
                process_resume_background,
                file_path,
                file.filename,
                resume.id,
                db
            )
            
            uploaded_files.append(file.filename)
            logger.info(f"文件上传成功: {file.filename}")
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"文件上传失败: {file.filename}, 错误: {error_msg}", exc_info=True)
            failed_files.append({
                "filename": file.filename,
                "error": error_msg
            })
    
    result_message = f"处理完成，成功: {len(uploaded_files)}, 失败: {len(failed_files)}"
    logger.info(f"批量上传完成: {result_message}")
    
    return UploadResponse(
        message=result_message,
        uploaded_files=uploaded_files,
        failed_files=failed_files,
        total_processed=len(files)
    )

@router.get("/{resume_id}/content")
async def get_resume_content(
    resume_id: int,
    db: Session = Depends(get_db)
):
    """获取简历内容"""
    resume = resume_crud.get(db, resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="简历不存在")
    
    return {
        "id": resume.id,
        "filename": resume.filename,
        "processing_status": resume.processing_status,
        "raw_text": resume.raw_text,
        "extracted_data": resume.extracted_data,
        "candidate_id": resume.candidate_id
    }

@router.get("/candidate/{candidate_id}")
async def get_candidate_resumes(
    candidate_id: int,
    db: Session = Depends(get_db)
):
    """获取候选人的所有简历"""
    resumes = resume_crud.get_by_candidate(db, candidate_id)
    return resumes

@router.get("/{resume_id}/download")
async def download_resume(
    resume_id: int,
    db: Session = Depends(get_db)
):
    """下载简历文件"""
    logger.info(f"开始下载简历: resume_id={resume_id}")
    
    # 获取简历记录
    resume = resume_crud.get(db, resume_id)
    if not resume:
        logger.warning(f"简历不存在: resume_id={resume_id}")
        raise HTTPException(status_code=404, detail="简历不存在")
    
    # 检查文件是否存在
    if not resume.file_path or not os.path.exists(resume.file_path):
        logger.error(f"简历文件不存在: resume_id={resume_id}, file_path={resume.file_path}")
        raise HTTPException(status_code=404, detail="简历文件不存在")
    
    # 检查是否为PDF文件
    if resume.file_type.lower() != 'pdf':
        logger.warning(f"文件类型不是PDF: resume_id={resume_id}, file_type={resume.file_type}")
        raise HTTPException(status_code=400, detail="只支持PDF文件预览")
    
    logger.info(f"返回简历文件: {resume.filename}, 路径: {resume.file_path}")
    
    # 对文件名进行URL编码以支持中文字符
    encoded_filename = quote(resume.filename.encode('utf-8'))
    
    # 返回文件响应
    return FileResponse(
        path=resume.file_path,
        filename=resume.filename,
        media_type='application/pdf',
        headers={
            "Content-Disposition": f"inline; filename*=UTF-8''{encoded_filename}",
            "Content-Type": "application/pdf"
        }
    )
