/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
    pgm.createTable('songs', {
        id: { type: 'varchar(50)', notNull: true, primaryKey: true },
        title: { type: 'varchar' },
        year: { type: 'integer' },
        genre: { type: 'varchar(20)' },
        performer: { type: 'varchar' },
        duration: { type: 'integer' },
        albumid: { type: 'varchar(50)', references: 'albums(id)' }
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    pgm.dropTable('songs');
};
