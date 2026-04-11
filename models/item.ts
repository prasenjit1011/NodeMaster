import { DataTypes, Model, Optional } from 'sequelize';
import dbconnect from '../util/mariadb_sequelize';

// Define full attributes
interface ItemAttributes {
  id: number;
  name: string;
}

// Define creation attributes (id optional because autoIncrement)
interface ItemCreationAttributes extends Optional<ItemAttributes, 'id'> {}

// Model class
class Item extends Model<ItemAttributes, ItemCreationAttributes>
  implements ItemAttributes {
  public id!: number;
  public name!: string;
}

// Initialize model
Item.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize: dbconnect,
    tableName: 'items',
    timestamps: false, // change if you use createdAt/updatedAt
  }
);

export default Item;
