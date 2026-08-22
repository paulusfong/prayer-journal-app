module MembershipGate
  extend ActiveSupport::Concern

  included do
    before_action :require_approved_membership
    helper_method :current_circle
  end

  class_methods do
    def allow_without_membership(**options)
      skip_before_action :require_approved_membership, **options
    end
  end

  private
    def current_circle
      Current.circle
    end

    def require_approved_membership
      return unless authenticated?

      membership = Current.user.memberships.includes(:circle).approved.first
      if membership
        Current.membership = membership
        Current.circle = membership.circle
        return
      end

      if Current.user.memberships.pending.any?
        redirect_to pending_path
      else
        redirect_to need_invite_path
      end
    end

    def require_owner
      head :forbidden unless Current.membership&.owner?
    end

    def set_prayer_request
      @prayer_request = Current.user.accessible_requests.find(params[:prayer_request_id] || params[:id])
    end
end
