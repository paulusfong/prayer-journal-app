class CreateJournalDomain < ActiveRecord::Migration[8.1]
  def change
    create_table :circles do |t|
      t.string :name, null: false
      t.timestamps
    end

    create_table :memberships do |t|
      t.references :user, null: false, foreign_key: true
      t.references :circle, null: false, foreign_key: true
      t.string :role, null: false, default: "member"
      t.string :status, null: false, default: "pending"
      t.timestamps
    end
    add_index :memberships, [ :circle_id, :user_id ], unique: true

    create_table :invites do |t|
      t.references :circle, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.string :token_digest, null: false
      t.string :token, null: false
      t.datetime :expires_at, null: false
      t.datetime :revoked_at
      t.timestamps
    end
    add_index :invites, :token_digest, unique: true
    add_index :invites, :token, unique: true

    create_table :magic_links do |t|
      t.references :user, null: false, foreign_key: true
      t.string :token_digest, null: false
      t.datetime :expires_at, null: false
      t.timestamps
    end
    add_index :magic_links, :token_digest, unique: true

    create_table :prayer_requests do |t|
      t.references :circle, null: false, foreign_key: true
      t.references :author, null: false, foreign_key: { to_table: :users }
      t.string :title, null: false
      t.text :body
      t.string :who_for
      t.string :category
      t.string :category_other
      t.date :hope_by
      t.string :visibility, null: false, default: "circle"
      t.string :status, null: false, default: "open"
      t.datetime :answered_at
      t.references :answered_by, foreign_key: { to_table: :users }
      t.integer :prayer_marks_count, null: false, default: 0
      t.timestamps
    end
    add_index :prayer_requests, [ :circle_id, :status ]
    add_index :prayer_requests, :hope_by

    create_table :request_updates do |t|
      t.references :prayer_request, null: false, foreign_key: true
      t.references :author, null: false, foreign_key: { to_table: :users }
      t.text :body, null: false
      t.timestamps
    end

    create_table :prayer_notes do |t|
      t.references :prayer_request, null: false, foreign_key: true
      t.references :author, null: false, foreign_key: { to_table: :users }
      t.string :body, null: false, limit: 280
      t.timestamps
    end

    create_table :prayer_marks do |t|
      t.references :prayer_request, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.timestamps
    end
    add_index :prayer_marks, [ :prayer_request_id, :user_id ], unique: true

    create_table :request_grants do |t|
      t.references :prayer_request, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.timestamps
    end
    add_index :request_grants, [ :prayer_request_id, :user_id ], unique: true
  end
end
