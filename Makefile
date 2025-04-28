# Makefile for Nuki App (Docker Compose v2)

SERVICE=nuki-app

.PHONY: build up down restart logs rebuild

build:
	docker compose build

up:
	docker compose up

down:
	docker compose down

restart:
	docker compose down
	docker compose up -d

logs:
	docker logs -f $(SERVICE)

rebuild:
	docker compose down
	docker compose build
	docker compose up
