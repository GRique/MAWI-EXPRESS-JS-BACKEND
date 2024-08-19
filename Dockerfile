# Use an official Node runtime as a parent image
FROM node:18.5.0

# Install dependencies
RUN apt-get update && apt-get install -y \
  wget \
  --no-install-recommends \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*


# Install Chromium
RUN apt-get update && apt-get install -y \
  chromium \
  --no-install-recommends \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
# Set the Puppeteer environment variable to use the installed Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the current directory contents into the container at /usr/src/app
COPY . .

# Install any needed packages specified in package.json
RUN npm install

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Define environment variable
ENV NODE_ENV production

# Run app.js when the container launches
CMD ["node", "app.js"]
