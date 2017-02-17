# Gita
This is a simple CLI tool to make creating and initially populating Github
repositories easier.

# Usage
To create a repository called `foo-repo` with the description `My Wonderful Repo`
that is private, and to set up tracking in the current directory, create a
`.gitignore` file, add and commit all existing files, and push to the repo:
```
gita create-repository foo-repo --description "My Wonderful Repo" --private --init
```

#### This sucks and it's broken!
It created this repository, which was the day's goal.  Unless you're reading this
on my local computer.  In which case, please stop reading this on my local computer.