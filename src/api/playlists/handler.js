const autoBind = require("auto-bind");

class PlaylistHandler {
    constructor(service, validator) {
        this._service = service;
        this._validator = validator;

        autoBind(this);
    }

    async postPlaylist(request, h) {
        this._validator.validatePlaylistPayload(request.payload);
        const { name } = request.payload;
        const { id: credentialId } = request.auth.credentials;

        const playlistId = await this._service.addPlaylist({
            name, owner: credentialId,
        });

        const response = h.response({
            status: 'success',
            message: 'Playlist berhasil ditambahkan',
            data: {
                playlistId,
            },
        });
        response.code(201);
        return response;
    }

    async getPlaylists(request) {
        const { id: credentialId } = request.auth.credentials;
        const playlists = await this._service.getPlaylists(credentialId);

        return {
            status: 'success',
            data: {
                playlists,
            },
        };
    }

    // async getPlaylistById(request) {
    //     const { id } = request.params;
    //     const { id: credentialId } = request.auth.credentials;

    //     await this._service.verifyPlaylistAccess(id, credentialId);

    //     const playlist = await this._service.getPlaylistById(id);
    //     return {
    //         status: 'success',
    //         data: {
    //             playlist,
    //         },
    //     };
    // }

    async putPlaylistById(request) {
        this._validator.validatePlaylistPayload(request.payload);
        const { id } = request.params;
        const { id: credentialId } = request.auth.credentials;
        await this._service.verifyPlaylistAccess(id, credentialId);

        await this._service.editPlaylistById(id, request.payload);
        return {
            status: 'success',
            message: 'Playlist berhasil diperbarui',
        };
    }

    async deletePlaylistById(request) {
        const { id } = request.params;
        const { id: credentialId } = request.auth.credentials;
        await this._service.verifyPlaylistOwner(id, credentialId);
        await this._service.deletePlaylistById(id);
        return {
            status: 'success',
            message: 'Playlist berhasil dihapus',
        };
    }

    async postSongToPlaylist(request, h) {
        this._validator.validateSongPayload(request.payload);
        const { songId } = request.payload;
        const { id: credentialId } = request.auth.credentials;
        const { id: playlistId } = request.params;

        await this._service.verifyPlaylistAccess(playlistId, credentialId);
        await this._service.addSongToPlaylist(playlistId, songId);
        await this._service.addActvities(playlistId, songId, credentialId, 'add');

        const response = h.response({
            status: 'success',
            message: 'Lagu berhasil ditambahkan ke playlist',
        });
        response.code(201);
        return response;
    }

    async getSongsInPlaylist(request) {
        const { id } = request.params;
        const { id: credentialId } = request.auth.credentials;

        await this._service.verifyPlaylistAccess(id, credentialId);
        const playlist = await this._service.getPlaylistById(id);
        const songs = await this._service.getSongsInPlaylist(id);

        return {
            status: 'success',
            data: {
                playlist: {
                    ...playlist,
                    songs
                }
            },
        };
    }

    async deleteSongFromPlaylist(request) {
        this._validator.validateSongPayload(request.payload);
        const { songId } = request.payload;
        const { id: credentialId } = request.auth.credentials;
        const { id: playlistId } = request.params;

        await this._service.verifyPlaylistAccess(playlistId, credentialId);
        await this._service.deleteSongFromPlaylist(playlistId, songId);
        await this._service.addActvities(playlistId, songId, credentialId, 'delete');

        return {
            status: 'success',
            message: 'Lagu berhasil dihapus dari playlist',
        };
    }

    async getPlaylistActivities(request) {
        const { id } = request.params;
        const { id: credentialId } = request.auth.credentials;

        await this._service.verifyPlaylistAccess(id, credentialId);
        const activities = await this._service.getPlaylistActivities(id);

        return {
            status: 'success',
            data: {
                playlistId: id,
                activities,
            },
        };
    }
}

module.exports = PlaylistHandler;