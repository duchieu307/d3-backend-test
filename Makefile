prepare:
	cp .env.example .env && yarn && yarn build

deploy:
	pm2 start app.json

run:
	make prepare && make deploy

update:
	yarn build && make deploy