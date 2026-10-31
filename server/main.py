import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.db import Base, engine
from models import PasswordReset, User
from router.auth import admin_router, router as auth_router

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(",")
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)


 
Base.metadata.create_all(bind=engine)
app.include_router(auth_router)
app.include_router(admin_router)


@app.get("/")
def read_root():
    return {"message": "Hello World"} 
 