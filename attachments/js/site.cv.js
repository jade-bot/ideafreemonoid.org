window.CV = Ember.Application.create({
    rootElement: $("#cv")
});

CV.Router = {
    index: function (){
        App.hideAll();
        CV.sectionsController.reloadData();
        this.get("rootElement").show();
        App.setTitle("CV");
        _gaq.push(["_trackPageview", "#!/cv"]);
    }
};

CV.Section = Ember.Object.extend({
      type: "cv-section"
    , title: null
    , content_raw: null
    , order: 1
    , created_at: null
    , last_updated: null
    , _id: null
    , _rev: null
});

CV.sectionsController = Ember.ArrayController.create({
      content: []
    , currentUserBinding: "User.userController.currentUser"

    , createSection: function (title, content, order){
        if (this.get("currentUser").get("is_connected")){
            var now = dateISOString(new Date());

            var section = {
                  type: "cv-section"
                , title: title
                , content_raw: content || "\n"
                , order: order || ((_(this.get("content")).chain().map(function (doc){return doc.get('order')}).max().value() || 0) + 1)
                , created_at: now
                , last_updated: now
            };

            var self = this;

            IFMAPI.getUUIDs(function (err, response){
                if (err){
                    //TODO: error handling
                    console.log(response);
                }

                if (response && response.uuids){
                    section._id = response.uuids[0];

                    IFMAPI.putDoc(section._id, section, function (err, response){
                        if (err){
                            //TODO: error handling
                            console.log(response);
                        }

                        console.log(response);

                        if (response && response.ok){
                            section._rev = response.rev;

                            self.pushObject(CV.Section.create(section));
                            self.resort();
                        }
                    });
                }
            });
        }
        else {
            //TODO: error handling
        }
    }
    , reloadData: function (){
        var self = this;
        IFMAPI.getView("cvsections", {include_docs: true}, function (err, response){
            if (err){
                //TODO: error handling
                console.log(response);
            }

            if (response && response.rows){
                self.set('content', _(response.rows).chain().pluck('doc').map(function (doc){return CV.Section.create(doc);}).value());
                self.resort();
            }
        });
    }
    , resort: function (){
        this.set('content', _(this.get('content')).sortBy(function (section){return section.get('order');}));
    }
    , sectionForm: function (content){
        content = content || false;
        if (this.get("currentUser").get("is_connected")){
            var cview = CV.CreateView.create({});
            cview.appendTo(CV.rootElement);
        }
        else {
            //TODO: error handling
        }
    }
});

CV.CVView = Ember.View.extend({
      templateName: "cv"

    , cvSectionView: Ember.View.extend({
        templateName: "cv-section"
    })
    , addSectionLink = Ember.View.extend({
        templateName: "cv-add-section-link"
        , currentUserBinding: "CV.sectionsController.currentUser"
        , click: function (event){
            event.preventDefault();
            CV.sectionsController.sectionForm();
            return false;
        }
    })
});

CV.CreateView = Ember.View.extend({
      templateName: "cv-section-form"
    , submit: function (event){
        this.remove();
        return false;
    }
})

CV.EditView = CV.CreateView.extend({
    submit: function (event){

        return false;
    }
});
