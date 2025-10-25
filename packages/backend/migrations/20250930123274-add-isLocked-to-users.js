
export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("users", "isLocked", {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn("users", "isLocked");
}
