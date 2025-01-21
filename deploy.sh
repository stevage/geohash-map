cp -pr dist/* deployed/
mkdir -p docs
cp -pr dist/* docs/
git add docs/*
git commit -m "Deploy"
git push