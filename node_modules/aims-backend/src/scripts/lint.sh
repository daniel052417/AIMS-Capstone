echo "🔍 Running ESLint..."

# Lint TypeScript files
npx eslint src/**/*.ts --ext .ts

# Check if linting passed
if [ $? -eq 0 ]; then
  echo "✅ ESLint passed successfully!"
else
  echo "❌ ESLint found issues. Please fix them before committing."
  exit 1
fi