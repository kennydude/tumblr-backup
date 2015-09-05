var Post = Backbone.Model.extend({
    defaults: {
        "title": "",
        "video": "",
        "photos": [],
        "url": "",
        "text": "",
        "tags": []
    }
});

var WaitView = Backbone.Marionette.ItemView.extend({
    template: "#loading"
})

var PostView = Backbone.Marionette.ItemView.extend({
    template: "#post",
    modelEvents: {
        "sync": "render"
    }
});

var ShortPostView = Backbone.Marionette.ItemView.extend({
    template: "#short-post",
    tagName: "li"
});

var ListPostsView = Backbone.Marionette.CompositeView.extend({
    childView: ShortPostView,
    emptyView: WaitView,

    template: "#list",
    childViewContainer: ".list",

    templateHelpers: function(){
        return {
            title: this.options.title
        }
    },

    collectionEvents: {
        "sync": "render"
    }
});

var ListPostCollection = Backbone.Collection.extend({
    parse: function(rsp){
        var o = _.map(rsp, function(v){
            return {value: v};
        });
        return o;
    },
    url: "/posts.json"
});

var PostTaggedCollection = Backbone.Collection.extend({
    parse: function(rsp){
        rsp = rsp[this.tag];

        var o = _.map(rsp, function(v){
            return {value: v};
        });
        return o;
    },
    url: "/tags.json"
});

var manager = new Backbone.Marionette.RegionManager({
  regions: {
    "body": "#appContents"
  }
});

var Router = Backbone.Router.extend({
    routes: {
        "": "index",
        "post/:post": "post",
        "tag/:tag": "tag"
    },

    tag: function(tag){
        var posts = new PostTaggedCollection();
        posts.tag = tag;
        manager.get("body").show(new ListPostsView({
            collection: posts,
            title: "Posts tagged " + tag
        }));
        posts.fetch();
    },

    post: function(p){
        var model = new Post();
        model.url = p;
        manager.get("body").show(new PostView({
            model: model
        }));
        model.fetch();
    },

    index: function(){
        var posts = new ListPostCollection();
        manager.get("body").show(new ListPostsView({
            collection: posts,
            title: "All posts"
        }));
        posts.fetch();
    }
});
new Router();
Backbone.history.start({pushState: false});
