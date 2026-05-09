from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime

# SQLite 데이터베이스 파일 경로를 지정
# backend 폴더 내에 'log_doctor.db' 파일로 데이터를 영구 저장하기 위함
SQLALCHEMY_DATABASE_URL = "sqlite:///./log_doctor.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# DB에 저장될 데이터의 테이블 구조(스키마)를 정의
# 시간, 위험도 등을 정형화하여 저장해야 나중에 "주간 장애 통계" 등을 산출할 수 있기 때문
class LogDiagnosis(Base):
    __tablename__ = "log_history"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow) # 발생 시간
    log_level = Column(String)                                     # 에러 레벨 (ERROR 등)
    original_log = Column(Text)                                    # 원본 로그 메시지
    analysis_report = Column(Text)                                 # AI 진단 리포트
    risk_level = Column(String)                                    # 위험도 (High, Medium, Low)

# 정의된 테이블 구조를 실제 DB 파일에 생성합니다.
def init_db():
    Base.metadata.create_all(bind=engine)