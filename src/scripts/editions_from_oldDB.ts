import connectDB from "../config/DatabaseConfig";
import editions from "./editions.json";
import { IEdition, Edition, EditionStatus } from "../api/models/editionModel";
import "colors";

export interface OldEdition {
  id: number;
  name: string;
  link: string;
  ajax: string;
  deleted_at: string;
  created_at: string;
  updated_at: string;
  period: string;
  sID: number;
}

const old_editons = editions as OldEdition[];

const new_editions = old_editons.filter((e) => e.sID != 0 && !e.deleted_at);
new_editions.sort((a, b) => a.sID - b.sID);

console.log(new_editions.map((e) => e.sID));

connectDB().then(() => {
  const ed = new_editions.map((old_edition) => {
    const new_edition = {
      name: old_edition.name,
      edition_id: old_edition.sID,
      status: EditionStatus.Published,
      edition_link: old_edition.link,
      published_at: new Date(old_edition.updated_at),
      createdAt: new Date(old_edition.created_at),
      updatedAt: new Date(old_edition.updated_at),
    } as IEdition;
    return new_edition;
  });
  Edition.insertMany(ed)
    .then(() => {
      console.log("Editions added successfully".green.inverse);
    })
    .catch((e) => {
      console.log("Error adding editions", e);
    })
    .finally(() => process.exit());
});
