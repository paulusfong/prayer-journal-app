class Current < ActiveSupport::CurrentAttributes
  attribute :session, :circle, :membership
  delegate :user, to: :session, allow_nil: true
end
