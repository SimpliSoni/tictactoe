# Use the official Nakama image. Using a specific version is good practice.
FROM heroiclabs/nakama:3.20.0

# Copy your custom game logic modules (even though the folder is empty right now)
# This ensures that when you *do* add logic, it gets copied in.
COPY ./nakama/modules /nakama/data/modules