FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir discord.py pydantic-settings python-dotenv httpx

COPY . .

CMD ["python", "bot.py"]
