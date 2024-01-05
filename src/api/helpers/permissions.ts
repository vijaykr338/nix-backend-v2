/** Javascript lacks interface, so I would need a 
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
            case 0: return new CreateProfile;
            case 1: return new ReadProfile;
            default: throw new Error("Invalid permission id");
        }
    }
}


export class CreateProfile extends Permission { constructor() { super(0); } }
export class ReadProfile extends Permission { constructor() { super(1); } }