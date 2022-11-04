const EmailList = (sequelize, DataTypes) => {
  const _Email = sequelize.define(
    "EmailList",
    {
      name: {
        type: DataTypes.STRING,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Email not provided",
          },
          isEmail: {
            msg: "It is not a valid email",
          },
        },
        unique: {
          args: true,
          msg: "The email is already in use",
        },
      },
      emailHashed: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "active",
      },
    },
    {
      paranoid: true,
      defaultScope: {
        returning: true,
      },
    }
  );

  _Email.beforeValidate(async (data) => {
    Object.keys(data).forEach((key) => {
      if (data[key] === "") {
        Object.assign(data, { [key]: null });
      }
    });
  });

  _Email.beforeCreate(async (data) => {
    const email = await hashData(data.password);
    Object.assign(data, { email });
  });

  _Email.beforeUpdate(async (data) => {
    if (data.email && data.changed("email")) {
      const emailHashed = await hashData(data.email);
      Object.assign(data, { emailHashed });
    }
  });

  _Email.associate = (models) => {
    // you can create associations with other models here
    // See https://sequelize.org/docs/v6/core-concepts/assocs/
  };

  return _Email;
};

export default EmailList;
