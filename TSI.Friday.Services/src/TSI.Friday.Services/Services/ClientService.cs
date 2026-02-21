using AutoMapper;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Services
{
    public sealed class ClientService : IClientService
    {
        #region Properties

        /// <summary>
        /// Repository object created to access the Client registers on database using EntityFramework.
        /// </summary>
        private readonly IRepository<Client> _repository;
        private readonly IMapper _mapper;

        #endregion Properties

        #region Public methods

        /// <summary>
        /// ClientService constructor created to initialize the "_repository" using Dependency Injection.
        /// </summary>
        /// <param name="repository">IRepository<Client> object used to initialize the internal variable using Dependency Injection.</param>
        /// <param name="mapper">Mapper object used to initialize the internal variable using Dependency Injection.</param>
        public ClientService(IRepository<Client> repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<ClientDto>> Remove(ClientDto clientDto)
        {
            WebApiResponse<ClientDto> result = new();

            try
            {
                var client = await _repository.GetByIdAsync(clientDto.Id);
                if (client == null)
                {
                    throw new Exception($"Cliente com Id {clientDto.Id} não encontrado.");
                }

                await _repository.RemoveAsync(client);

                result.Data = clientDto;
                result.Status = ResponseStatus.Success;
                result.Message = $"Cliente {client.Name} removido com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível remover o Cliente {clientDto.Name} da base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<ClientDto>>> FindAll()
        {
            WebApiResponse<IEnumerable<ClientDto>> result = new();

            try
            {
                var clients = await _repository.GetAllAsync(c => c.Addresses);

                result.Data = _mapper.Map<IEnumerable<ClientDto>>(clients);
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data.Count()} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<ClientDto>> FindById(int? id)
        {
            WebApiResponse<ClientDto> result = new();

            try
            {
                var clientEntity = await _repository.GetByIdAsync(id);
                result.Data = _mapper.Map<ClientDto>(clientEntity);
                result.Status = ResponseStatus.Success;
                result.Message =
                    result.Data != null
                        ? $"Cliente {result.Data.Name} encontrado com sucesso"
                        : $"Nenhum Cliente com o ID {id} foi encontrado";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<ClientDto>> FindByEmail(string email)
        {
            WebApiResponse<ClientDto> result = new();

            try
            {
                var clientEntity = await _repository.FirstOrDefaultAsync(x => x.Email == email);
                result.Data = _mapper.Map<ClientDto>(clientEntity);
                result.Status = ResponseStatus.Success;
                result.Message =
                    result.Data != null
                        ? $"Cliente {result.Data.Name} encontrado com sucesso."
                        : $"Nenhum Cliente com o E-mail {email} foi encontrado";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        #endregion Public methods

        #region Private methods

        #endregion Private methods
    }
}
