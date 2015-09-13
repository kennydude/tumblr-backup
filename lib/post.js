require("babel/polyfill");

let crypto = require('crypto');
let path = require('path');
let spawn = require('child_process').spawnSync;
let _ = require('underscore');
let colours = require('colors');

/**
* Reads a tumblr api post response and chews it up so it's easier
* to deal with
*/
class TumblrPost {
    constructor(post){
        this.downloads = [];

        switch(post['type']){
            case "text":
                this.text = this.html(post['body']);
                this.title = post['title'];
                break;
            case "photo":
                this.text = this.html(post['caption']);
                this.photos = _.map(post['photos'], function(photo){
                    var url = _.max(photo.alt_sizes, function(s){
                        return s.width;
                    }).url;
                    return this.replaceFile(url);
                }, this);
                break;
            case "answer":
                this.text = this.html(post['answer']);
                if(this.text.length == 0){
                    this.text = this.trail(post['trail']);
                }
                this.question = post['question'];
                this.asker = post['asking_name'];
                break;
            case "audio":
                this.text = this.html(post['caption']);
                this.audio = this.replaceFile(post['audio_url'] + "#.mp3");
                break;
            case "quote":
                this.text = "<blockquote>" + post['text']
                    + "</blockquote>" + this.html(post['source']);
                break;
            case "chat":
                this.text = "<pre>" + post['body'] + "</pre>";
                this.title = post['title'];
                break;
            case "link":
                this.text = this.html(post['description']);
                this.title = post['title'];
                this.link = post['url'];
                break;
            case "video":
                this.text = this.html(post['caption']);
                if(post['video_type'] == "tumblr"){
                    this.video = this.replaceFile(post['video_url']);
                } else if(post['permalink_url']){
                    console.log('[i]'.bold.yellow + ' Getting video link...'.yellow);
                    this.video = this.externalVideo(post['permalink_url']);
                }
                break;
            default:
                throw new Error("Cannot parse type " + post['type']);
                break;
        }

        this.date = post['date'];
        this.url = post['post_url'];
        this.tags = post['tags'];
        this.filename = "post-" + post['timestamp'] + '-' +
            (post['slug'] || post['type']) + '.json';
    }

    /**
    * Parses HTML from Tumblr for images etc
    */
    html(html){
        return html
            .replace("<!-- more -->", "<hr class='more' />")
            .replace(/https?:\/\/[0-9\.]+media\.tumblr\.com\/[^ \"]+/g, this.replaceFile.bind(this));
    }

    /**
    * Adds file to downloads list and returns the filename to use
    */
    replaceFile(url){
        let shasum = crypto.createHash('sha1');
        shasum.update(url);
        let filename = 'image-' + shasum.digest('hex') + path.extname(url);

        this.downloads.push({'d': url, 'f': filename});
        return filename;
    }

    /**
    * Deal with tumblr "trails" (undocumented! thanks tumblr grrrr)
    */
    trail(trail){
        return _.map(trail, function(item){
            return `
<figure>
    <blockquote>${this.html(item.content)}</blockquote>
    <footer>
        — <cite>
            <a href="http://${item.blog.name}.tumblr.com/post/${item.post.id}">
                ${item.blog.name}
            </a>
        </cite>
    </footer>
</figure>
            `;
        }, this).join("");
    }

    externalVideo(url){
        let args = ['--print-json', '-f', 'best', '--skip-download', url];
        let rsp = spawn('./node_modules/youtube-dl/bin/youtube-dl', args);
        let data = JSON.parse(rsp.stdout.toString());
        return data['url'];
    }
}

export default TumblrPost;
