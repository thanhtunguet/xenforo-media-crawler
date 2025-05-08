#!/usr/bin/env bash

echo "Generating data..."
source .env

yarn typeorm-model-generator -e mysql -h $DB_HOST -d $DB_NAME -u $DB_USER -x $DB_PASSWORD
rm -rf src/_entities/
mkdir src/_entities/
mv output/entities/* src/_entities/
yarn node-index update src/_entities/
rm -rf output/

# Define the directory containing the .ts files
TARGET_DIR="src/_entities"

# Find all .ts files in the target directory and replace "id: string;" with "id: number;"
find "$TARGET_DIR" -type f -name "*.ts" -exec sed -i 's/id: string;/id: number;/g' {} +

# Find all .ts files in the target directory and replace "Id: string;" with "Id: number;"
find "$TARGET_DIR" -type f -name "*.ts" -exec sed -i 's/Id: string;/Id: number;/g' {} +

echo "Replacement complete in all .ts files within $TARGET_DIR"

yarn eslint --fix src/_entities/*.ts