﻿using Shuttle.Access.Events.User.v1;
using Shuttle.Access.Sql;
using Shuttle.Core.Contract;
using Shuttle.Recall;

namespace Shuttle.Access.Server.Projection
{
    public class UserHandler :
        IEventHandler<Registered>,
        IEventHandler<RoleAdded>,
        IEventHandler<RoleRemoved>,
        IEventHandler<Removed>
    {
        private readonly ISystemUserQuery _query;

        public UserHandler(ISystemUserQuery query)
        {
            Guard.AgainstNull(query, nameof(query));

            _query = query;
        }

        public void ProcessEvent(IEventHandlerContext<Registered> context)
        {
            _query.Register(context.PrimitiveEvent, context.Event);
        }

        public void ProcessEvent(IEventHandlerContext<RoleAdded> context)
        {
            _query.RoleAdded(context.PrimitiveEvent, context.Event);
        }

        public void ProcessEvent(IEventHandlerContext<RoleRemoved> context)
        {
            _query.RoleRemoved(context.PrimitiveEvent, context.Event);
        }

        public void ProcessEvent(IEventHandlerContext<Removed> context)
        {
            _query.Removed(context.PrimitiveEvent, context.Event);
        }
    }
}