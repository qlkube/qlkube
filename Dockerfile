FROM node:12

ENV NODE_EXTRA_CA_CERTS /var/run/secrets/kubernetes.io/serviceaccount/ca.crt \
    USER=ubuntu \
    UID=1000 \
    GID=1000 \
    WORKDIR=/usr/src/app \
    LISTEN_PORT=3000

COPY . /usr/src/app

WORKDIR $WORKDIR

RUN npm install

RUN addgroup --gid "$GID" "$USER" \
    && adduser \
         --disabled-password \
         --gecos "" \
         --ingroup "$USER" \
         --uid "$UID" \
         --shell /bin/bash \
         "$USER" \
    && chown $USER:$USER -R /home/"$USER" $WORKDIR

USER $UID

EXPOSE 3000

ENTRYPOINT [ "npm", "start" ]