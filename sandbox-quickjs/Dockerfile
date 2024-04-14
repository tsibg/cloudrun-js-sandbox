FROM denoland/deno:alpine

WORKDIR /usr/src/app
# Install system dependencies

# Cache the dependencies as a layer (the following two steps are re-run only when deps.ts is modified).
# Ideally cache deps.ts will download and compile _all_ external files used in main.ts.
COPY deps.js .
RUN deno cache deps.js

# These steps will be re-run upon each file change in your working directory:
COPY . .
# Compile the main app so that it doesn't need to be compiled each startup/entry.
RUN deno cache main.js

# Prefer not to run as root.
USER deno

ENV HOST="0.0.0.0"
ENV PORT 8081

# The port that your application listens to.
EXPOSE ${PORT}

CMD deno run --allow-net=${HOST}:${PORT} --allow-env=HOST,PORT --allow-read=.,../example-scripts --unstable-worker-options --cached-only --no-prompt main.js