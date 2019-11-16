const db = require("../models");
var Sequelize = require("sequelize");
const Op = Sequelize.Op;

async function updateWorkSpace(workSpaceId, workSpace) {
  return db.Workspace.update(workSpace, { where: { id: workSpaceId } });
}

async function updateWorkSpaceFeatures(workSpaceId, featureArray) {
  var workSpaceFeaturePromises = [];

  featureArray.forEach(feature => {
    var workSpaceFeature = {
      status: feature.status,
      WorkspaceId: workSpaceId,
      FeatureId: feature.label
    };
    workSpaceFeaturePromises.push(
      db.WorkspaceFeature.upsert(workSpaceFeature, {
        where: {
          WorkspaceId: workSpaceId,
          FeatureId: feature.label
        }
      })
    );
  });
  return Sequelize.Promise.all(workSpaceFeaturePromises);
  // return workSpaceFeaturePromises;
}

async function updateWorkSpacePic(workSpacePic) {
  return db.WorkspacePic.upsert(workSpacePic, {
    where: {
      image_path: workSpacePic.image_path,
      // image_path: null,
      WorkspaceId: workSpacePic.workSpaceId
    }
  });
}
async function updateWorkSpaceDetail(workSpaceDetailObject) {
  var workSpaceId = workSpaceDetailObject.workSpaceId;
  var workSpace = {
    name: workSpaceDetailObject.workSpaceName,
    description: workSpaceDetailObject.workspaceDescription,
    dimension: workSpaceDetailObject.workSpaceDimensions,
    no_occupants: workSpaceDetailObject.workSpaceOccupancy,
    floor: 1,
    rental_price: workSpaceDetailObject.workSpaceDailyRate,
    isActive: workSpaceDetailObject.activateWorkSpace,
    WorkspaceLocationId: workSpaceDetailObject.workSpaceLocation
  };
  var workSpacePic = {
    image_path: workSpaceDetailObject.imageFileName,
    // image_path: null,
    WorkspaceId: workSpaceDetailObject.workSpaceId
  };

  var updateWorkSpaceTable = await updateWorkSpace(workSpaceId, workSpace);
  var updateWorkSpaceFeaturesTable = await updateWorkSpaceFeatures(
    workSpaceId,
    workSpaceDetailObject.FEATURE_LIST
  );
  var updateWorkSpacePicTable = await updateWorkSpacePic(workSpacePic);
  console.log(updateWorkSpaceTable);
  console.log(updateWorkSpaceFeaturesTable);
  console.log(updateWorkSpacePicTable);
}

module.exports = {
  findAll: function(req, res) {
    db.Workspace.findAll({
      include: [
        { model: db.WorkspaceLocation, include: [db.User] },
        { model: db.WorkspacePic }
      ]
    })
      .then(dbModel => res.json(dbModel))
      .catch(err => res.status(422).json(err));
  },
  findAllByLocation: function(req, res) {
    db.Workspace.findAll({
      include: [
        { model: db.WorkspaceLocation, where: { id: req.parms.id } },
        { model: db.WorkspacePic }
      ]
    })
      .then(dbModel => res.json(dbModel))
      .catch(err => res.status(422).json(err));
  },
  findAllDetail: function(req, res) {
    db.Workspace.findAll({
      include: [
        { model: db.WorkspaceLocation, include: [db.User] },
        { model: db.Feature },
        { model: db.WorkspaceAvailability },
        { model: db.WorkspacePic }
      ]
    })
      .then(dbModel => res.json(dbModel))
      .catch(err => res.status(422).json(err));
  },
  findDetailById: function(req, res) {
    db.Workspace.findAll({
      where: { id: req.params.id },
      include: [
        { model: db.WorkspaceLocation },
        { model: db.Feature },
        { model: db.WorkspaceAvailability },
        { model: db.WorkspacePic }
      ]
    })
      .then(dbModel => res.json(dbModel))
      .catch(err => res.status(422).json(err));
  },
  findBySearch: function(req, res) {
    const {
      location,
      checkindate,
      checkoutdate,
      peoplecount,
      roomcount
    } = req.params;

    const occupancy = peoplecount / roomcount;

    db.Workspace.findAll({
      where: {
        [Op.and]: [
          { isActive: true },
          { no_occupants: { [Op.gte]: occupancy } }
        ]
      },
      include: [
        {
          model: db.WorkspaceLocation,
          where: {
            [Op.or]: [
              { addr1: { [Op.like]: `%${location}%` } },
              { addr2: { [Op.like]: `%${location}%` } },
              { city: { [Op.like]: `%${location}%` } },
              { province: { [Op.like]: `%${location}%` } },
              { postal_code: { [Op.like]: `%${location}%` } }
            ]
          }
        },
        { model: db.WorkspacePic, limit: 1 },
        {
          model: db.WorkspaceAvailability,
          where: { date: { [Op.between]: [checkindate, checkoutdate] } }
        }
      ]
    })
      .then(dbModel => res.json(dbModel))
      .catch(err => res.status(422).json(err));
  },
  updateWorkSpaceDetail1: function(req, res) {
    // res.send(req.body);
    var workSpaceDetailObject = req.body;
    var updatedWorkSpaceHeader;

    var workSpace = {
      name: req.body.workSpaceName,
      description: req.body.workspaceDescription,
      dimension: req.body.workSpaceDimensions,
      no_occupants: req.body.workSpaceOccupancy,
      floor: 1,
      rental_price: req.body.workSpaceDailyRate,
      isActive: req.body.activateWorkSpace,
      WorkspaceLocationId: req.body.workSpaceLocation
    };

    var workSpacePic = {
      image_path: req.body.imageFileName,
      // image_path: null,
      WorkspaceId: req.body.workSpaceId
    };

    db.sequelizeConnection
      .transaction(t => {
        return db.Workspace.update(
          workSpace,
          { where: { id: req.body.workSpaceId } },
          { transaction: t }
        ).then(updatedWorkSpace => {
          updatedWorkSpaceHeader = updatedWorkSpace;
          var workSpacePromises = [];
          req.body.FEATURE_LIST.forEach(feature => {
            var workSpaceFeature = {
              status: feature.status,
              WorkspaceId: req.body.workSpaceId,
              FeatureId: feature.label
            };
            workSpacePromises.push(
              db.WorkspaceFeature.upsert(
                workSpaceFeature,
                {
                  where: {
                    WorkspaceId: req.body.workSpaceId,
                    FeatureId: feature.label
                  }
                },
                { transaction: t }
              )
            );
          });
          console.log("Finished workspace and features");
          return Sequelize.Promise.all(workSpacePromises).then(count => {
            var workSpacePicPromises = [];
            workSpacePicPromises.push(
              db.WorkspacePic.upsert(
                workSpacePic,
                {
                  where: {
                    image_path: req.body.imageFileName,
                    // image_path: null,
                    WorkspaceId: req.body.workSpaceId
                  }
                },
                { transaction: t }
              )
            );
            return Sequelize.Promise.all(workSpacePicPromises);
          });
        });
      })
      .then(() => {
        res.json(updatedWorkSpaceHeader);
      })
      .catch(function(error) {
        console.log(error);
        res.sendStatus(400);
      });
  },

  updateWorkSpaceDetail: function(req, res) {
    var workSpaceDetailObject = req.body;
    updateWorkSpaceDetail(workSpaceDetailObject);
    console.log("567");
  }
};
