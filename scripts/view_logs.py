#!/usr/bin/env python3
# filepath: /Users/polly/Downloads/Sublime_Workspace/GitHub_Workspace/Hr_Copilot_v2/scripts/view_logs.py
"""
日志查看脚本
用于查看和分析HR Copilot的日志文件
"""

import os
import sys
import argparse
from datetime import datetime, timedelta
import json

def get_log_files(log_dir="logs"):
    """获取日志文件列表"""
    if not os.path.exists(log_dir):
        print(f"日志目录不存在: {log_dir}")
        return []
    
    log_files = []
    for file in os.listdir(log_dir):
        if file.endswith('.log'):
            file_path = os.path.join(log_dir, file)
            log_files.append({
                'name': file,
                'path': file_path,
                'size': os.path.getsize(file_path),
                'modified': datetime.fromtimestamp(os.path.getmtime(file_path))
            })
    
    return sorted(log_files, key=lambda x: x['modified'], reverse=True)

def view_recent_logs(log_type="all", lines=50):
    """查看最近的日志"""
    log_files = get_log_files()
    
    if log_type == "llm":
        target_files = [f for f in log_files if "llm_requests" in f['name']]
    elif log_type == "errors":
        target_files = [f for f in log_files if "errors" in f['name']]
    elif log_type == "app":
        target_files = [f for f in log_files if "hr_copilot" in f['name']]
    else:
        target_files = log_files
    
    if not target_files:
        print(f"没有找到 {log_type} 类型的日志文件")
        return
    
    print(f"=== 最近 {lines} 行 {log_type} 日志 ===")
    for log_file in target_files[:3]:  # 最多显示3个最新的日志文件
        print(f"\n--- {log_file['name']} (大小: {log_file['size']} bytes) ---")
        
        try:
            with open(log_file['path'], 'r', encoding='utf-8') as f:
                all_lines = f.readlines()
                recent_lines = all_lines[-lines:] if len(all_lines) > lines else all_lines
                
                for line in recent_lines:
                    print(line.rstrip())
        except Exception as e:
            print(f"读取日志文件失败: {e}")

def search_logs(keyword, log_type="all"):
    """搜索日志中的关键词"""
    log_files = get_log_files()
    
    if log_type == "llm":
        target_files = [f for f in log_files if "llm_requests" in f['name']]
    elif log_type == "errors":
        target_files = [f for f in log_files if "errors" in f['name']]
    elif log_type == "app":
        target_files = [f for f in log_files if "hr_copilot" in f['name']]
    else:
        target_files = log_files
    
    print(f"=== 搜索关键词: '{keyword}' ===")
    
    found_count = 0
    for log_file in target_files:
        try:
            with open(log_file['path'], 'r', encoding='utf-8') as f:
                for line_num, line in enumerate(f, 1):
                    if keyword.lower() in line.lower():
                        print(f"{log_file['name']}:{line_num}: {line.rstrip()}")
                        found_count += 1
        except Exception as e:
            print(f"搜索文件 {log_file['name']} 失败: {e}")
    
    print(f"\n总共找到 {found_count} 个匹配项")

def analyze_llm_logs():
    """分析LLM请求日志"""
    log_files = get_log_files()
    llm_files = [f for f in log_files if "llm_requests" in f['name']]
    
    if not llm_files:
        print("没有找到LLM请求日志文件")
        return
    
    print("=== LLM请求日志分析 ===")
    
    total_requests = 0
    successful_requests = 0
    failed_requests = 0
    total_duration = 0
    request_methods = {}
    
    for log_file in llm_files:
        print(f"\n分析文件: {log_file['name']}")
        
        try:
            with open(log_file['path'], 'r', encoding='utf-8') as f:
                for line in f:
                    if "LLM请求开始" in line:
                        total_requests += 1
                        try:
                            # 尝试解析JSON数据
                            json_part = line.split("LLM请求开始: ")[1]
                            data = json.loads(json_part)
                            method = data.get('method', 'unknown')
                            request_methods[method] = request_methods.get(method, 0) + 1
                        except:
                            pass
                    
                    elif "LLM请求成功" in line:
                        successful_requests += 1
                        try:
                            json_part = line.split("LLM请求成功: ")[1]
                            data = json.loads(json_part)
                            duration = data.get('duration_seconds', 0)
                            if duration:
                                total_duration += duration
                        except:
                            pass
                    
                    elif "LLM请求失败" in line:
                        failed_requests += 1
        
        except Exception as e:
            print(f"分析文件失败: {e}")
    
    print(f"\n=== 统计结果 ===")
    print(f"总请求数: {total_requests}")
    print(f"成功请求数: {successful_requests}")
    print(f"失败请求数: {failed_requests}")
    print(f"成功率: {(successful_requests/total_requests*100):.1f}%" if total_requests > 0 else "无数据")
    print(f"平均响应时间: {(total_duration/successful_requests):.2f}秒" if successful_requests > 0 else "无数据")
    
    print(f"\n=== 请求方法分布 ===")
    for method, count in request_methods.items():
        print(f"{method}: {count} 次")

def main():
    parser = argparse.ArgumentParser(description='HR Copilot 日志查看工具')
    parser.add_argument('--type', choices=['all', 'app', 'llm', 'errors'], 
                       default='all', help='日志类型')
    parser.add_argument('--lines', type=int, default=50, 
                       help='显示的行数')
    parser.add_argument('--search', type=str, 
                       help='搜索关键词')
    parser.add_argument('--analyze', action='store_true', 
                       help='分析LLM日志')
    parser.add_argument('--list', action='store_true', 
                       help='列出日志文件')
    
    args = parser.parse_args()
    
    if args.list:
        log_files = get_log_files()
        print("=== 日志文件列表 ===")
        for log_file in log_files:
            print(f"{log_file['name']:<30} {log_file['size']:>10} bytes  {log_file['modified']}")
    elif args.search:
        search_logs(args.search, args.type)
    elif args.analyze:
        analyze_llm_logs()
    else:
        view_recent_logs(args.type, args.lines)

if __name__ == "__main__":
    main()
