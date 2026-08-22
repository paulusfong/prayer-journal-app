# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_08_22_195000) do
  create_table "circles", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
  end

  create_table "invites", force: :cascade do |t|
    t.integer "circle_id", null: false
    t.datetime "created_at", null: false
    t.integer "created_by_id", null: false
    t.datetime "expires_at", null: false
    t.datetime "revoked_at"
    t.string "token", null: false
    t.string "token_digest", null: false
    t.datetime "updated_at", null: false
    t.index ["circle_id"], name: "index_invites_on_circle_id"
    t.index ["created_by_id"], name: "index_invites_on_created_by_id"
    t.index ["token"], name: "index_invites_on_token", unique: true
    t.index ["token_digest"], name: "index_invites_on_token_digest", unique: true
  end

  create_table "magic_links", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "token_digest", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["token_digest"], name: "index_magic_links_on_token_digest", unique: true
    t.index ["user_id"], name: "index_magic_links_on_user_id"
  end

  create_table "memberships", force: :cascade do |t|
    t.integer "circle_id", null: false
    t.datetime "created_at", null: false
    t.string "role", default: "member", null: false
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["circle_id", "user_id"], name: "index_memberships_on_circle_id_and_user_id", unique: true
    t.index ["circle_id"], name: "index_memberships_on_circle_id"
    t.index ["user_id"], name: "index_memberships_on_user_id"
  end

  create_table "prayer_marks", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "prayer_request_id", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["prayer_request_id", "user_id"], name: "index_prayer_marks_on_prayer_request_id_and_user_id", unique: true
    t.index ["prayer_request_id"], name: "index_prayer_marks_on_prayer_request_id"
    t.index ["user_id"], name: "index_prayer_marks_on_user_id"
  end

  create_table "prayer_notes", force: :cascade do |t|
    t.integer "author_id", null: false
    t.string "body", limit: 280, null: false
    t.datetime "created_at", null: false
    t.integer "prayer_request_id", null: false
    t.datetime "updated_at", null: false
    t.index ["author_id"], name: "index_prayer_notes_on_author_id"
    t.index ["prayer_request_id"], name: "index_prayer_notes_on_prayer_request_id"
  end

  create_table "prayer_requests", force: :cascade do |t|
    t.datetime "answered_at"
    t.integer "answered_by_id"
    t.integer "author_id", null: false
    t.text "body"
    t.string "category"
    t.string "category_other"
    t.integer "circle_id", null: false
    t.datetime "created_at", null: false
    t.date "hope_by"
    t.integer "prayer_marks_count", default: 0, null: false
    t.string "status", default: "open", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.string "visibility", default: "circle", null: false
    t.string "who_for"
    t.index ["answered_by_id"], name: "index_prayer_requests_on_answered_by_id"
    t.index ["author_id"], name: "index_prayer_requests_on_author_id"
    t.index ["circle_id", "status"], name: "index_prayer_requests_on_circle_id_and_status"
    t.index ["circle_id"], name: "index_prayer_requests_on_circle_id"
    t.index ["hope_by"], name: "index_prayer_requests_on_hope_by"
  end

  create_table "request_grants", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "prayer_request_id", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["prayer_request_id", "user_id"], name: "index_request_grants_on_prayer_request_id_and_user_id", unique: true
    t.index ["prayer_request_id"], name: "index_request_grants_on_prayer_request_id"
    t.index ["user_id"], name: "index_request_grants_on_user_id"
  end

  create_table "request_updates", force: :cascade do |t|
    t.integer "author_id", null: false
    t.text "body", null: false
    t.datetime "created_at", null: false
    t.integer "prayer_request_id", null: false
    t.datetime "updated_at", null: false
    t.index ["author_id"], name: "index_request_updates_on_author_id"
    t.index ["prayer_request_id"], name: "index_request_updates_on_prayer_request_id"
  end

  create_table "sessions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "ip_address"
    t.datetime "updated_at", null: false
    t.string "user_agent"
    t.integer "user_id", null: false
    t.index ["user_id"], name: "index_sessions_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "display_name"
    t.string "email_address", null: false
    t.string "password_digest"
    t.datetime "updated_at", null: false
    t.index ["email_address"], name: "index_users_on_email_address", unique: true
  end

  add_foreign_key "invites", "circles"
  add_foreign_key "invites", "users", column: "created_by_id"
  add_foreign_key "magic_links", "users"
  add_foreign_key "memberships", "circles"
  add_foreign_key "memberships", "users"
  add_foreign_key "prayer_marks", "prayer_requests"
  add_foreign_key "prayer_marks", "users"
  add_foreign_key "prayer_notes", "prayer_requests"
  add_foreign_key "prayer_notes", "users", column: "author_id"
  add_foreign_key "prayer_requests", "circles"
  add_foreign_key "prayer_requests", "users", column: "answered_by_id"
  add_foreign_key "prayer_requests", "users", column: "author_id"
  add_foreign_key "request_grants", "prayer_requests"
  add_foreign_key "request_grants", "users"
  add_foreign_key "request_updates", "prayer_requests"
  add_foreign_key "request_updates", "users", column: "author_id"
  add_foreign_key "sessions", "users"
end
