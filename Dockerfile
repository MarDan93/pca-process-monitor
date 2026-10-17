# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim@sha256:a5f4366e834695d5f363b920c104953a535d3a9864d1bdf74566a0ebe01daee5 AS frontend
WORKDIR /build
COPY prototype/package.json prototype/package-lock.json ./prototype/
COPY web/package.json web/package-lock.json ./web/
RUN --mount=type=secret,id=build_ca,target=/tmp/build-ca.pem \
    if [ -f /tmp/build-ca.pem ]; then export NODE_EXTRA_CA_CERTS=/tmp/build-ca.pem; fi; \
    cd prototype && npm ci --ignore-scripts && cd ../web && npm ci --ignore-scripts
COPY prototype/*.js ./prototype/
COPY prototype/locales ./prototype/locales
COPY prototype/licenses ./prototype/licenses
COPY web ./web
RUN cd web && npm run build

FROM python:3.12-slim-bookworm@sha256:34386ef0cb081344d7ec1c103ba398e6e9f64e9ab3a1509accc92a4e24a07258 AS runtime
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=/app/server MOULD_RUNTIME=hosted PORT=8000
WORKDIR /app
COPY server/requirements.lock /app/server/requirements.lock
RUN --mount=type=secret,id=build_ca,target=/tmp/build-ca.pem \
    if [ -f /tmp/build-ca.pem ]; then export PIP_CERT=/tmp/build-ca.pem; fi; \
    python -m pip install --no-cache-dir --require-hashes -r server/requirements.lock
RUN groupadd --gid 10001 workspace && useradd --uid 10001 --gid 10001 --no-create-home workspace \
    && mkdir /var/data && chown workspace:workspace /var/data
COPY server/app /app/server/app
COPY --from=frontend /build/web/dist /app/web/dist
COPY LICENSE NOTICE /app/
RUN chmod -R a+rX /app/server/app /app/web/dist && chmod a+r /app/LICENSE /app/NOTICE
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD python -c "import os,urllib.request; urllib.request.urlopen('http://127.0.0.1:'+os.environ.get('PORT','8000')+'/api/health',timeout=3)"
ENTRYPOINT ["python", "-m", "app.container"]
CMD ["python", "-m", "app"]
