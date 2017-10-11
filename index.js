#!/usr/bin/env node

var argv = process.argv.slice(2);
var path = require('path');
var glob = require('glob');
var fs = require('fs');

console.log('tumblr-backup');

var key = "fuiKNFp9vQFvjLNvx4sUwti4Yb5yGutBN4Xh10LXZhhRKjWlV4";

var command = argv[0];
switch (command) {
    case 'backup':
        var request = require('request');
        var _ = require('underscore');
        var crypto = require('crypto');
        var async = require('async');

        var what = argv[1];
        if(what.indexOf(".") == -1){
            what = what + ".tumblr.com";
        }

        var where = path.resolve(process.cwd(), argv[2] || "");

        console.log('backup:');
        console.log('* blog: %s', what);
        console.log('* to: %s', where);

        // Create backup dir if not existant already
        if(!fs.existsSync(where)){
            fs.mkdirSync(where);
        }

        // See if we have a max to get to
        var files = glob.sync(path.join(where, "post-*.json"));
        if(_.isEmpty(files)){
            var upto = null;
        } else{
            var upto = path.basename(_.max(files, function(file){
                return path.basename(file).split("-")[1] * 1;
            }));
        }

        // Now we go through tumblr!
        // First setup tags
        var tags = {};
        var allposts = [];
        if(fs.existsSync(path.join(where, 'tags.json'))){
            tags = JSON.parse(fs.readFileSync(path.join(where, 'tags.json')));
        }
        if(fs.existsSync(path.join(where, 'posts.json'))){
            allposts = JSON.parse(fs.readFileSync(path.join(where, 'posts.json')));
        }

        // Finih
        function fin(){
            console.log('all posts found. saving indexes');
            fs.writeFileSync(path.join(where, 'tags.json'),
                JSON.stringify(tags));
            fs.writeFileSync(path.join(where, 'posts.json'),
                JSON.stringify(allposts));
        }

        // Crawler
        function trawl(start){
            var downloads = [];
            // Image parser
            var ip = function(url){
                var shasum = crypto.createHash('sha1');
                shasum.update(url);
                var filename = 'image-' + shasum.digest('hex') + path.extname(url);
                downloads.push({'d': url, 'f': filename});

                return filename;
            }

            var i = function(post){
                //var url = post['photo-url-1280'] || post['photo-url-500'] ||
                //    post['photo-url-400'] || post['photo-url-250'] ||
                //    post['photo-url-100'] || post['photo-url-75'];
                var url = _.max(post.alt_sizes, function(s){
                    return s.width;
                }).url;

                return ip(url);
            };

            var p = function(html){
                return html.replace("<!-- more -->", "<hr class='more' />").replace(/https?:\/\/[0-9\.]+media\.tumblr\.com\/[^ \"]+/g, ip);
            };

            var d = function(c){
                // Now we clean up
                async.each(downloads, function(download, callback){
                    console.log("<< %s", download['d']);
                    request({
                        url: download['d'],
                        encoding: null
                    }, function(error, response, body){
                        if(!error && response.statusCode == 200){
                            fs.writeFileSync(path.join(where, download['f']), body);
                            callback();
                        } else {
                            if(response){
                                console.log("code: " + response.statusCode);
                            }
                            console.error("err: " + error);
                            process.exit(-1);
                        }
                    });
                }, c);
            }

            var url = "http://api.tumblr.com/v2/blog/" + what + "/posts?offset=" + start + "&api_key=" + key;
            console.log("< %s", url);
            request(url, function(error, response, body){
                if(!error && response.statusCode == 200){
                    // Cut out tumblr's shit
                    body = JSON.parse(body);
                    // Now parse it!
                    if(body.response.posts.length == 0){
                        console.log("no more posts");
                        fin();
                        return;
                    }

                    var cancel = false;
                    _.each(body.response.posts, function(post){
                        var filename = "post-" + post['timestamp'] + '-' +
                            (post['slug'] || post['type']) + '.json';

                        if(filename == upto){
                            console.log('previous backup point found');
                            d(function(){
                                fin();
                                process.exit(0);
                            });
                            cancel = true;
                            return;
                        }
                        if(cancel == true){
                            return;
                        }

                        if(post['format'] != "html"){
                            throw new Error("cannot handle " + post['format'] + " yet");
                        }
                        var output = {};

                        switch(post['type']){
                            case 'text':
                                output = {
                                    "text": p(post['body']),
                                    "title": post['title']
                                }
                                break;
                            case 'answer':
                                output = {
                                    "text": p(post['answer']),
                                    "question": post['question'],
                                    "asker": post['asking_name']
                                }
                                break;
                            case 'quote':
                                output = {
                                    "text": "<blockquote>" + post['text']
                                        + "</blockquote>" + p(post['source'])
                                };
                                break;
                            case 'audio':
                                output = {
                                    "text": p(post['caption']),
                                    "audio": ip(post['audio_url'])
                                }
                                break;
                            case 'chat':
                                output = {
                                    "text": "<pre>" + post['body'] + "</pre>",
                                    "title": post['title']
                                }
                            case 'link':
                                output = {
                                    "text": p(post['description']),
                                    "title": post['title'],
                                    "link": post['url']
                                };
                                break;
                            case 'video':
                                output = {
                                    "text": p(post['caption'])
                                }
                                if(post['video_type'] == "tumblr"){
                                    output["video"] = ip(post['video_url']);
                                } else{
                                    output['vidoe_embed'] = post['player'][0]
['embed_code'];
                                }
                                break;
                            case 'photo':
                                if(post['photos'].length > 0){
                                    output = {
                                        "text": p(post['caption']),
                                        "photos": _.map(post['photos'], function(photo){
                                            return i(photo);
                                        })
                                    };
                                } else{
                                    output = {
                                        "text": p(post['caption']),
                                        "photos": [
                                            i(post)
                                        ]
                                    };
                                }
                                break;
                            default:
                                throw new Error("Cannot handle post type " + post['type'] + " yet");
                        }
                        output['date'] = post['date'];
                        output['url'] = post['post_url'];
                        output['tags'] = post['tags'];

                        // Deal with tags
                        _.each(post['tags'], function(tag){
                            if(!tags[tag]){
                                tags[tag] = [];
                            }
                            tags[tag].push(filename);
                        });
                        allposts.push(filename);

                        fs.writeFileSync(path.join(where, filename),
                            JSON.stringify(output));
                    });

                    d(function(){
                        trawl(start+20);
                    });
                } else {
                    console.error("could not download posts!!!");
                    if(response){
                        console.log("code: " + response.statusCode);
                    }
                    console.error("err: " + error);
                    process.exit(-1);
                }
            });
        }
        trawl(0);
        break;
    case 'serve':
        var where = path.resolve(process.cwd(), argv[1] || "");
        var port = argv[2] || 8080;

        console.log('serve');
        console.log('* from: %s', where);
        console.log('* port: %s', port);

        var express = require('express');
        var app = express();

        app.use('/', express.static(path.join(__dirname, 'static')));
        app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
        app.use('/', express.static(where));

        app.listen(port);
        break;
    default:
        console.log('actions:');
        console.log('* backup myblogname where');
        console.log('* serve dirname port (example for cwd: tumblr-backup serve .)');
}
