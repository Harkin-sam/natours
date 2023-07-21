// REFACTORING USING CLASSES
class APIFeatures {
    constructor(query, queryString) {
      this.query = query;
      this.queryString = queryString;
    }
  
    filter() {
      const queryObj = { ...this.queryString };
      const excludeFields = ['page', 'sort', 'limit', 'fields'];
  
      excludeFields.forEach((el) => delete queryObj[el]);
  
      // console.log(req.query, queryObj);
  
      // 2) Advanced Filtering
      let queryStr = JSON.stringify(queryObj);
  
      // using regex to replace string
      queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`); // match callback here will return the replaced matched word
  
      // console.log(JSON.parse(queryStr));
      this.query = this.query.find(JSON.parse(queryStr));
  
      return this; // this here is the entire object class
    }
  
    sort() {
      if (this.queryString.sort) {
        const sortBy = this.queryString.sort.split(',').join(' ');
  
        this.query = this.query.sort(sortBy); // sort('price ratingsAverage')
        // query = query.sort(req.query.sort);
      } else {
        this.query = this.query.sort('-createdAt'); // this sort it in descending order based on the createAt time
      }
  
      return this;
    }
  
    limitFields(){
       // FIELD LIMITING
       if (this.queryString.fields) {
        const fields = this.queryString.fields.split(',').join(' '); //'name duration price' this is the arg format for the select method
        this.query = this.query.select(fields);
  
        // this will select the properties name, duration, price only from the document
        // we cannot remove id tho
      } else {
        this.query = this.query.select('-__v'); // the minus sign here excludes the property __v from the result, Prefix a field name you want to exclude with a '-' to exclude field
      }
  
      return this;
    }
  
    paginate(){
      //PAGINATION
  
      //127.0.01:8000/api/v1/tours?page=2&limit=10, 
  
      const page = this.queryString.page * 1 || 1;
      const limit = this.queryString.limit * 1 || 100;
      const skip = (page - 1) * limit;
  
      this.query = this.query.skip(skip).limit(limit); // skip() is the amount of result that should be skipped before querying data
  
      return this;
    }
  }

  module.exports = APIFeatures;