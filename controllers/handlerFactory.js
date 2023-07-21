// GENERIC FUNCTION TO HANDLE EVERY DELETE FEATURE IN OUR APP
// pass in the model
// return an async function

const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete({ _id: req.params.id });

    //Adding 404 not found error if tour is not found
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null, // to show the item we deleted no longer exist
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // querying for the document we want to update and updating it
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    // the 3rd argument is an options object new means it should return the new updated document

    //Adding 404 not found error if tour is not found
    if (!doc) {
      return next(new AppError('No Tour found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (Model, propOptions) =>
  catchAsync(async (req, res, next) => {
    // findById only finds one document
    let query = Model.findById(req.params.id);
    if (propOptions) query = query.populate(propOptions);

    const doc = await query;

    //populate reviews here fetches the reviews array in the review model liked to this particular tour iD as a virtual property

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews on Tour (small hack)
    let filter = {};
    // check if theres is tourId exist
    if (req.params.tourId) filter = { tour: req.params.tourId };

    //EXECUTE QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate(); // this chaining only worked because when we call each method in the class it returns 'this'

    // const doc = await features.query.explain(); // explain() here is for showing the no of queried doc & info when you use tourSchema.index()

    const doc = await features.query;
    
    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        doc,
      },
    });
  });
