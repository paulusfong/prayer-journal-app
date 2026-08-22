class ApplicationController < ActionController::Base
  include Authentication
  include MembershipGate

  stale_when_importmap_changes

  helper_method :current_user

  private
    def current_user
      Current.user
    end
end
