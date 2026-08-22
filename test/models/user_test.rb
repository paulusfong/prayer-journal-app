require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "display label falls back to email local part" do
    user = User.new(email_address: "Ada@Example.com")
    assert_equal "ada", user.display_label
  end
end
