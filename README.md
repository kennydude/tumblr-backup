# Tumblr Backup

**Note:** [Tumblr Backup NG](https://gitlab.com/kennydude/tb-ng) replaces this

[![Circle CI](https://circleci.com/gh/kennydude/tumblr-backup.svg?style=svg)](https://circleci.com/gh/kennydude/tumblr-backup)

Backup your tumblr!

## Install

        [sudo] npm i tumblr-backup

## Usage

Backup your blog first!

        tumblr-backup hostname-or-cname where-to

Then you can browse your archive:

        tumblr-backup serve where-to

Don't worry, everything is just json files and the related media (yes it
downloads images etc too!)


In-progress: Version 2 which will bring a rewrite using tests and a lot more :)
TODO: use grunt or something for building a deploy version w/browserify
