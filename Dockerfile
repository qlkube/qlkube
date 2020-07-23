FROM node:12

ENV NODE_EXTRA_CA_CERTS=/var/run/secrets/kubernetes.io/serviceaccount/ca.crt \
    UID=1000 \
    LISTEN_PORT=3000 \
    WORKDIR=/usr/src/app

COPY . ${WORKDIR}

WORKDIR ${WORKDIR}

RUN npm install \
    && chown $UID:$UID -R /home/"${USER}" ${WORKDIR}

USER ${UID}

EXPOSE ${LISTEN_PORT}

ENTRYPOINT [ "npm", "start" ]