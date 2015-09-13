'use strict';
import TumblrPost from "./lib/post";

let fs = require('fs');
let chai = require('chai');
chai.should();

function getFile(f){
    return JSON.parse(fs.readFileSync(f));
}

describe('parse tumblr posts correctly', function(){

    it('read text posts', function(){
        let post = new TumblrPost(getFile("./fixtures/text.json"));
        post.title.should.equal('Reclaiming Idealism through GLOW');
        post.text.should.have.length(4533);

        post.filename.should.equal('post-1441667535-reclaiming-idealism-through-glow.json');
        post.tags.should.eql(["Macedonia", "GLOW", "Peace Corps", "girls empowerment"]);
        post.url.should.equal('http://peacecorps.tumblr.com/post/128594462530/reclaiming-idealism-through-glow');
        post.date.should.equal('2015-09-07 23:12:15 GMT');
    });

    it('read photo posts', function(){
        let post = new TumblrPost(getFile("./fixtures/photo.json"));
        post.text.should.have.length(285);
        post.photos.should.eql(["image-0fda452f1f161a70f851b01ee4635f2854c50259.jpg"]);
    });

    it('read old answer posts', function(){
        let post = new TumblrPost(getFile("./fixtures/answer-old.json"));
        post.text.should.have.length(198);
        post.question.should.have.length(28);
        post.asker.should.equal("Anonymous");
    });

    it('read new answer posts', function(){
        let post = new TumblrPost(getFile("./fixtures/answer.json"));
        post.text.should.have.length(349);
        post.question.should.have.length(55);
        post.asker.should.equal("sweetniha");
    });

    it('read audio posts', function(){
        let post = new TumblrPost(getFile("./fixtures/audio.json"));
        post.text.should.have.length(333);
        post.audio.should.equal("image-59a6e09870c5120da1ac6710872a219a7dbeddd9.mp3");
    });

    it('read quote posts', function(){
        let post = new TumblrPost(getFile("./fixtures/quote.json"));
        post.text.should.have.length(310);
    });

    it('read chat posts', function(){
        let post = new TumblrPost(getFile("./fixtures/chat.json"));
        post.text.should.have.length(152);
    });

    it('read link posts', function(){
        let post = new TumblrPost(getFile("./fixtures/link.json"));
        post.text.should.have.length(228);
        post.title.should.equal("Mental Health and Me");
        post.link.should.equal("http://me.gmph.co/mental-health/");
    });

});

describe('parse tumblr video posts properly', function(){
    it('read vine post', function(){
        let post = new TumblrPost(getFile("./fixtures/video-vine.json"));
        post.video.should.have.length.above(10);
        post.text.should.have.length(342);
    });
    it('read youtube post', function(){
        let post = new TumblrPost(getFile("./fixtures/video-youtube.json"));
        post.video.should.have.length.above(10);
        post.text.should.have.length(143);
    });
    it('read tumblr video post', function(){
        let post = new TumblrPost(getFile("./fixtures/video-tumblr.json"));
        post.video.should.have.length.above(10);
        post.text.should.have.length(889);
    })
});
