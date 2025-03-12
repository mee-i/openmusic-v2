const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');
const autoBind = require('auto-bind');

class PlaylistsService {
    constructor(collaborationService) {
        this._pool = new Pool();
        this._collaborationService = collaborationService;
        autoBind(this);
    }
    async addPlaylist({ name, owner }) {
        const id = `playlist-${nanoid(16)}`;

        const query = {
            text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
            values: [id, name, owner],
        };

        const result = await this._pool.query(query);

        if (!result.rows.length) {
            throw new InvariantError('Playlist gagal ditambahkan');
        }

        return result.rows[0].id;
    }
    async getPlaylists(owner) {
        const query = {
            text: `SELECT playlists.id, playlists.name, users.username
            FROM playlists
            LEFT JOIN users ON playlists.owner = users.id
            LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id
            WHERE playlists.owner = $1 OR collaborations.user_id = $1
            GROUP BY playlists.id, users.username
            `, values: [owner]
        };
        const result = await this._pool.query(query);
        return result.rows;
    }

    async getPlaylistById(id) {
        const query = {
            text: `SELECT playlists.id, playlists.name, users.username 
            FROM playlists
            LEFT JOIN users ON users.id = playlists.owner
            WHERE playlists.id = $1
            `, values: [id]
        };
        const result = await this._pool.query(query);
        if (!result.rows.length) {
            throw new NotFoundError('Playlist tidak ditemukan');
        }
        return result.rows[0];
    }

    async editPlaylistById(id, { name }) {
        const query = {
            text: 'UPDATE playlists SET name = $1 WHERE id = $2 RETURNING id',
            values: [name, id],
        };

        const result = await this._pool.query(query);

        if (!result.rows.length) {
            throw new NotFoundError('Gagal memperbarui playlist. Id tidak ditemukan');
        }
    }

    async deletePlaylistById(id) {
        const query = {
            text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
            values: [id],
        };

        const result = await this._pool.query(query);

        if (!result.rows.length) {
            throw new NotFoundError('Playlist gagal dihapus. Id tidak ditemukan');
        }
    }

    async verifyPlaylistOwner(id, owner) {
        const query = {
            text: 'SELECT * FROM playlists WHERE id = $1',
            values: [id],
        };

        const result = await this._pool.query(query);
        if (!result.rows.length) {
            throw new NotFoundError('Playlist tidak ditemukan');
        }
        const playlist = result.rows[0];
        if (playlist.owner !== owner) {
            throw new AuthorizationError('Anda bukan pemilik playlist ini');
        }
    }

    async verifyPlaylistAccess(id, userId) {
        try {
            await this.verifyPlaylistOwner(id, userId);
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            try {
                await this._collaborationService.verifyCollaborator(id, userId);
            } catch {
                throw error;
            }
        }
    }

    async addSongToPlaylist(playlistId, songId) {

        const check_query = {
            text: 'SELECT * FROM songs WHERE id = $1',
            values: [songId],
        };
        
        const check_result = await this._pool.query(check_query);

        if (!check_result.rows.length) {
            throw new NotFoundError('Lagu tidak ditemukan');
        }

        const playlist_songs_id = `playlist_songs-${nanoid(16)}`;
        const query = {
            text: 'INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id',
            values: [playlist_songs_id, playlistId, songId],
        };

        const result = await this._pool.query(query);

        if (!result.rows.length) {
            throw new InvariantError('Lagu gagal ditambahkan ke playlist');
        }

        return result.rows[0].id;
    }

    async getSongsInPlaylist(playlistId) {
        const query = {
            text: `SELECT songs.id, songs.title, songs.performer FROM songs
            LEFT JOIN playlist_songs ON playlist_songs.song_id = songs.id
            WHERE playlist_songs.playlist_id = $1
            `, values: [playlistId]
        };
        const result = await this._pool.query(query);
        return result.rows;
    }

    async deleteSongFromPlaylist(playlistId, songId) {
        const query = {
            text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
            values: [playlistId, songId],
        };

        const result = await this._pool.query(query);

        if (!result.rows.length) {
            throw new InvariantError('Lagu gagal dihapus dari playlist');
        }
    }

    async addActvities(playlistId, songId, userId, action) {
        const playlist_activity_id = `playlist_activity-${nanoid(16)}`;
        const activity_query = {
            text: 'INSERT INTO playlist_song_activities VALUES($1, $2, $3, $4, $5) RETURNING id',
            values: [playlist_activity_id, playlistId, songId, userId, action],
        };

        const activity_result = await this._pool.query(activity_query);

        if (!activity_result.rows.length) {
            throw new InvariantError('Aktivitas gagal ditambahkan');
        }
    }

    async getPlaylistActivities(playlistId) {
        const query = {
            text: `
                SELECT users.username, songs.title, 
                       playlist_song_activities.action, 
                       playlist_song_activities.time
                FROM playlist_song_activities
                LEFT JOIN users ON users.id = playlist_song_activities.user_id
                LEFT JOIN songs ON songs.id = playlist_song_activities.song_id
                WHERE playlist_song_activities.playlist_id = $1
                ORDER BY playlist_song_activities.time ASC
            `,
            values: [playlistId],
        };
    
        const result = await this._pool.query(query);
        
        return result.rows;
    }    
}

module.exports = PlaylistsService;