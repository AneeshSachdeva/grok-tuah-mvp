#!/bin/bash

# Function to process files
process_files() {
    local dir=$1
    find "$dir" \( -name "*.ts" -o -name "*.tsx" -o -name "*.css" \) -type f | while read -r file; do
        echo "File: ${file#./}"
        echo "Content:"
        cat "$file"
        echo -e "\n---\n"
    done
}

# Main script
(
echo "Project Context:"
echo -e "================\n"

# Process src directory (or app directory for Next.js 13+)
if [ -d "./src" ]; then
    process_files "./src"
elif [ -d "./app" ]; then
    process_files "./app"
fi

# Process lib directory
if [ -d "./lib" ]; then
    process_files "./lib"
fi

# Process components directory
if [ -d "./components" ]; then
    process_files "./components"
fi

# Add specific root files
root_files=("tailwind.config.js" "next.config.js" "tsconfig.json" "package.json" "components.json")

for file in "${root_files[@]}"; do
    if [ -f "./$file" ]; then
        echo "File: $file"
        echo "Content:"
        cat "./$file"
        echo -e "\n---\n"
    fi
done

) | pbcopy  # Use 'xclip -selection clipboard' for Linux or 'clip' for Windows

echo "Context has been copied to clipboard!"