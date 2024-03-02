read -p "enter commit message :" message
echo "stashing changes"
git stash
echo "pulling from origin"
git pull origin main
echo "applying stash"
git stash apply
echo "staging and commiting"
git add .
git commit -m "$message"
echo "pushing to origin"
branch=$(git branch --show-current)
git push -u origin $branch
echo "pushed to branch"
echo "building docker file"
docker build -t rytham/videotube-backend
docker push rytham/videotube-backend
echo "build complete"