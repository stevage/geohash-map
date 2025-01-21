mkdir -p docs
cp CNAME docs
cp -pr dist/* docs/
git add docs/*
git commit -m "Deploy"
git push