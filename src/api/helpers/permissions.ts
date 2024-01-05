/** Javascript lacks enums, so I would need a 
 * hack to simulate these and make code "look" idiomatic
 * Writing this in tsc for my own convinience and to avoid errors
 * Also I can generate automatic JsDoc documentation if I use tsc
 */

/**
 * Permission superclass to be extended by all permissions
 *
 * @export
 * @class Permission
 * @typedef {Permission}
 */
export default class Permission {
    /** @type {number} */
    permission_id: number;
    /**
     * Creates an instance of Permission.
     *
     * @constructor
     * @param {number} id
     */
    constructor(id: number) {
        this.permission_id = id;
    }

    /**
     * Creates a permission child object from a `permission_id`
     * 
     * Throws an error if the `id` is invalid
     *
     * @returns {Permission}
     */
    to_permission(): Permission {
        switch (this.permission_id) {
            case 0: return new CreateProfile();
            case 1: return new ReadProfile();
            case 2: return new UpdateProfile();
            case 3: return new DeleteProfile();
            case 4: return new CreateRole();
            case 5: return new ReadRole();
            case 6: return new UpdateRole();
            case 7: return new DeleteRole();
            case 8: return new CreateStory();
            case 9: return new ReadStory();
            case 10: return new UpdateStory();
            case 11: return new DeleteStory();
            case 12: return new PublishStory();
            case 13: return new CreateGallery();
            case 14: return new ReadGallery();
            case 15: return new UpdateGallery();
            case 16: return new DeleteGallery();
            case 17: return new CreateAlbum();
            case 18: return new ReadAlbum();
            case 19: return new UpdateAlbum();
            case 20: return new DeleteAlbum();
            case 21: return new PublishAlbum();
            case 22: return new CreateCategory();
            case 23: return new ReadCategory();
            case 24: return new UpdateCategory();
            case 25: return new DeleteCategory();
            case 26: return new PublishImage();
            case 27: return new CreateCampaign();
            case 28: return new ReadCampaign();
            case 29: return new UpdateCampaign();
            case 30: return new DeleteCampaign();
            case 31: return new SendCampaign();
            default: throw new Error("Invalid permission id");
        }
    }
}


export class CreateProfile extends Permission { constructor() { super(0); } }
export class ReadProfile extends Permission { constructor() { super(1); } }
export class UpdateProfile extends Permission { constructor() { super(2); } }
export class DeleteProfile extends Permission { constructor() { super(3); } }
export class CreateRole extends Permission { constructor() { super(4); } }
export class ReadRole extends Permission { constructor() { super(5); } }
export class UpdateRole extends Permission { constructor() { super(6); } }
export class DeleteRole extends Permission { constructor() { super(7); } }
export class CreateStory extends Permission { constructor() { super(8); } }
export class ReadStory extends Permission { constructor() { super(9); } }
export class UpdateStory extends Permission { constructor() { super(10); } }
export class DeleteStory extends Permission { constructor() { super(11); } }
export class PublishStory extends Permission { constructor() { super(12); } }
export class CreateGallery extends Permission { constructor() { super(13); } }
export class ReadGallery extends Permission { constructor() { super(14); } }
export class UpdateGallery extends Permission { constructor() { super(15); } }
export class DeleteGallery extends Permission { constructor() { super(16); } }
export class CreateAlbum extends Permission { constructor() { super(17); } }
export class ReadAlbum extends Permission { constructor() { super(18); } }
export class UpdateAlbum extends Permission { constructor() { super(19); } }
export class DeleteAlbum extends Permission { constructor() { super(20); } }
export class PublishAlbum extends Permission { constructor() { super(21); } }
export class CreateCategory extends Permission { constructor() { super(22); } }
export class ReadCategory extends Permission { constructor() { super(23); } }
export class UpdateCategory extends Permission { constructor() { super(24); } }
export class DeleteCategory extends Permission { constructor() { super(25); } }
export class PublishImage extends Permission { constructor() { super(26); } }
export class CreateCampaign extends Permission { constructor() { super(27); } }
export class ReadCampaign extends Permission { constructor() { super(28); } }
export class UpdateCampaign extends Permission { constructor() { super(29); } }
export class DeleteCampaign extends Permission { constructor() { super(30); } }
export class SendCampaign extends Permission { constructor() { super(31); } }
