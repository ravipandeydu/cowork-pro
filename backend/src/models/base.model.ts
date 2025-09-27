import { Schema, Document, Model, Query } from 'mongoose';

// Base interface for all documents
export interface IBaseDocument extends Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

// Query helpers interface
export interface IBaseQueryHelpers {
  notDeleted(): Query<any, any>;
  onlyDeleted(): Query<any, any>;
}

// Static methods interface
export interface IBaseModel<T extends IBaseDocument> extends Model<T> {
  findNotDeleted(filter?: any): Query<T[], T>;
  findOneNotDeleted(filter?: any): Query<T | null, T>;
  countNotDeleted(filter?: any): Query<number, T>;
  softDeleteById(id: string): Query<T | null, T>;
  softDeleteMany(filter: any): Query<any, T>;
  restoreById(id: string): Query<T | null, T>;
  restoreMany(filter: any): Query<any, T>;
}

// Base schema options
export const baseSchemaOptions = {
  timestamps: true, // Automatically add createdAt and updatedAt
  versionKey: false as const, // Disable __v field
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      
      // Don't return deleted documents in JSON
      if (ret.isDeleted) {
        return null;
      }
      
      return ret;
    },
  },
  toObject: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
};

// Base schema definition
export const createBaseSchema = <T>(schemaDefinition: Record<string, any>): Schema<T & IBaseDocument, IBaseModel<T & IBaseDocument>, IBaseQueryHelpers> => {
  const schema = new Schema<T & IBaseDocument, IBaseModel<T & IBaseDocument>, IBaseQueryHelpers>({
    ...schemaDefinition,
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  }, baseSchemaOptions);

  // Add indexes for common queries
  schema.index({ createdAt: -1 });
  schema.index({ updatedAt: -1 });
  schema.index({ isDeleted: 1, createdAt: -1 });

  // Pre-save middleware to update timestamps
  schema.pre('save', function(next) {
    if (this.isNew) {
      (this as any).createdAt = new Date();
    }
    (this as any).updatedAt = new Date();
    next();
  });

  // Pre-update middleware to update timestamps
  schema.pre(['updateOne', 'findOneAndUpdate', 'updateMany'], function() {
    this.set({ updatedAt: new Date() });
  });

  // Add soft delete methods
  schema.methods.softDelete = function() {
    this.isDeleted = true;
    this.deletedAt = new Date();
    return this.save();
  };

  schema.methods.restore = function() {
    this.isDeleted = false;
    this.deletedAt = null;
    return this.save();
  };

  // Add query helpers for filtering deleted documents
  (schema.query as any).notDeleted = function(this: Query<any, any>) {
    return this.where({ isDeleted: { $ne: true } });
  };

  (schema.query as any).onlyDeleted = function(this: Query<any, any>) {
    return this.where({ isDeleted: true });
  };

  // Static methods for common operations
  schema.statics.findNotDeleted = function(filter = {}) {
    return this.find({ ...filter, isDeleted: { $ne: true } });
  };

  schema.statics.findOneNotDeleted = function(filter = {}) {
    return this.findOne({ ...filter, isDeleted: { $ne: true } });
  };

  schema.statics.countNotDeleted = function(filter = {}) {
    return this.countDocuments({ ...filter, isDeleted: { $ne: true } });
  };

  schema.statics.softDeleteById = function(id: string) {
    return this.findByIdAndUpdate(
      id,
      { 
        isDeleted: true, 
        deletedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );
  };

  schema.statics.restoreById = function(id: string) {
    return this.findByIdAndUpdate(
      id,
      { 
        isDeleted: false, 
        deletedAt: null,
        updatedAt: new Date()
      },
      { new: true }
    );
  };

  return schema;
};

// Base model interface with static methods
export interface IBaseModel<T extends IBaseDocument> extends Model<T> {
  findNotDeleted(filter?: any): any;
  findOneNotDeleted(filter?: any): any;
  countNotDeleted(filter?: any): any;
  softDeleteById(id: string): any;
  restoreById(id: string): any;
}

// Pagination interface
export interface IPaginationOptions {
  page?: number;
  limit?: number;
  sort?: string;
  select?: string;
  populate?: string | any[];
}

export interface IPaginationResult<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
}

// Pagination helper function
export const paginate = async <T extends IBaseDocument>(
  model: IBaseModel<T>,
  filter: any = {},
  options: IPaginationOptions = {}
): Promise<IPaginationResult<T>> => {
  const {
    page = 1,
    limit = 10,
    sort = '-createdAt',
    select = '',
    populate = []
  } = options;

  const skip = (page - 1) * limit;
  
  // Add soft delete filter
  const finalFilter = { ...filter, isDeleted: { $ne: true } };

  // Build query
  let query = model.find(finalFilter);
  
  if (select) {
    query = query.select(select);
  }
  
  if (populate.length > 0) {
    if (Array.isArray(populate)) {
      populate.forEach(pop => {
        query = query.populate(pop);
      });
    } else {
      query = query.populate(populate);
    }
  }

  // Execute queries
  const [docs, totalDocs] = await Promise.all([
    query.sort(sort).skip(skip).limit(limit).exec(),
    model.countNotDeleted(filter)
  ]);

  const totalPages = Math.ceil(totalDocs / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    docs,
    totalDocs,
    limit,
    page,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null,
  };
};