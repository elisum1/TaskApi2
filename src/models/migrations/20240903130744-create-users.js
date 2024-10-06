'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Primero, creamos la tabla 'Users' si no existe
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      resetToken: {
        type: DataTypes.STRING,
        allowNull: true
      },
      resetTokenExpiry: {
        type: DataTypes.DATE,
        allowNull: true
      }
      
    }, {
      timestamps: true // Si deseas que se creen campos de fecha de creación y actualización
    });

    // Luego, creamos la tabla 'Tasks' si no existe
    await queryInterface.createTable('Tasks', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Title is required' },
        },
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      dueDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Pendiente',
        validate: {
          isIn: {
            args: [['Pendiente', 'En Progreso', 'Completada']],
            msg: 'Status must be one of: Pendiente, En Progreso, Completada',
          },
        },
      },
      priority: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Normal',
        validate: {
          isIn: {
            args: [['Low', 'Normal', 'High','Very High']],
            msg: 'Priority must be one of: Low, Normal, High, Very High',
          },
        },
      },
      category: {
        type: Sequelize.STRING,
        allowNull: true,
        validate: {
          notEmpty: { msg: 'Category cannot be empty' },
        },
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      profilePhoto: {  // Corregido aquí
        type: DataTypes.STRING,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    // Eliminamos primero la tabla 'Tasks' para evitar conflictos con la clave foránea
    await queryInterface.dropTable('Tasks');

    // Luego eliminamos la tabla 'Users'
    await queryInterface.dropTable('Users');
  },
};
